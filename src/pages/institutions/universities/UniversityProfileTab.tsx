/**
 * Profile tab for the University form.
 *
 * Extracted from UniversityFormPage.tsx — owns the contacts, social links,
 * map location, and document attachments managed under the university profile.
 */

import { useEffect, useMemo, useState } from 'react'
import { useStableCallback } from '@/hooks/useStableCallback'
import { useUniversityProfile, useUpdateUniversityProfile } from '@/hooks/useUniversity'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Save, MapPin, Share2, FileText, Users, Trash2, Plus } from 'lucide-react'
import { FormSection } from './UniversityFormShared'

// Brand names (Telegram, Instagram, ...) are proper nouns — identical in all locales.
// Only 'Website' is a translatable generic term; the rest fall through t() harmlessly.
const SOCIAL_PLATFORMS = [
  { key: 'website', labelKey: 'Website', placeholder: 'https://university.uz' },
  { key: 'telegram', labelKey: 'Telegram', placeholder: 'https://t.me/university' },
  { key: 'instagram', labelKey: 'Instagram', placeholder: 'https://instagram.com/university' },
  { key: 'youtube', labelKey: 'YouTube', placeholder: 'https://youtube.com/@university' },
  { key: 'facebook', labelKey: 'Facebook', placeholder: 'https://facebook.com/university' },
  { key: 'twitter', labelKey: 'Twitter', placeholder: 'https://twitter.com/university' },
  {
    key: 'linkedin',
    labelKey: 'LinkedIn',
    placeholder: 'https://linkedin.com/company/university',
  },
] as const

const DOCUMENT_TYPES = ['LICENSE', 'ACCREDITATION', 'CHARTER', 'OTHER'] as const

type DocRow = {
  type: string
  name: string
  fileKey?: string | null
  validFrom?: string | null
  validTo?: string | null
}

interface ProfileTabProps {
  code: string
  t: (key: string) => string
}

export function ProfileTab({ code, t }: ProfileTabProps) {
  const { data: profile } = useUniversityProfile(code)
  const updateMutation = useUpdateUniversityProfile(code)

  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [description, setDescription] = useState('')
  const [social, setSocial] = useState<Record<string, string>>({})
  const [docs, setDocs] = useState<DocRow[]>([])
  const [mapUrl, setMapUrl] = useState('')
  const [latitude, setLatitude] = useState<string>('')
  const [longitude, setLongitude] = useState<string>('')

  const fillFromProfile = useStableCallback((p: typeof profile) => {
    if (!p) return
    setPhone(p.phone ?? '')
    setEmail(p.email ?? '')
    setDescription(p.description ?? '')
    setSocial({
      website: p.socialLinks?.website ?? '',
      telegram: p.socialLinks?.telegram ?? '',
      instagram: p.socialLinks?.instagram ?? '',
      youtube: p.socialLinks?.youtube ?? '',
      facebook: p.socialLinks?.facebook ?? '',
      twitter: p.socialLinks?.twitter ?? '',
      linkedin: p.socialLinks?.linkedin ?? '',
    })
    setDocs(
      (p.documents ?? []).map((d) => ({
        type: d.type,
        name: d.name,
        fileKey: d.fileKey ?? null,
        validFrom: d.validFrom ?? null,
        validTo: d.validTo ?? null,
      })),
    )
    setMapUrl(p.mapUrl ?? '')
    setLatitude(p.latitude != null ? String(p.latitude) : '')
    setLongitude(p.longitude != null ? String(p.longitude) : '')
  })

  useEffect(() => {
    fillFromProfile(profile)
  }, [profile, fillFromProfile])

  // Extract coordinates from Google/Yandex Maps URL
  const extractCoords = () => {
    if (!mapUrl) return
    // Google: /@41.3123,69.2435,15z OR ?q=41.3123,69.2435 OR !3d41.3!4d69.2
    const googleAt = mapUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
    const googleQ = mapUrl.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/)
    const googleBang = mapUrl.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/)
    // Yandex: ?ll=69.24%2C41.31 (lng,lat — reversed!)
    const yandexLl = mapUrl.match(/[?&]ll=(-?\d+\.\d+)(?:%2C|,)(-?\d+\.\d+)/)
    // OSM / geo: URI  —  geo:41.31,69.24
    const geoUri = mapUrl.match(/^geo:(-?\d+\.\d+),(-?\d+\.\d+)/)

    let lat: string | null = null
    let lng: string | null = null
    if (googleAt) {
      lat = googleAt[1]
      lng = googleAt[2]
    } else if (googleQ) {
      lat = googleQ[1]
      lng = googleQ[2]
    } else if (googleBang) {
      lat = googleBang[1]
      lng = googleBang[2]
    } else if (yandexLl) {
      lng = yandexLl[1]
      lat = yandexLl[2]
    } else if (geoUri) {
      lat = geoUri[1]
      lng = geoUri[2]
    }

    if (lat && lng) {
      setLatitude(lat)
      setLongitude(lng)
    }
  }

  const addDoc = () => setDocs((prev) => [...prev, { type: 'LICENSE', name: '' }])
  const updateDoc = (idx: number, patch: Partial<DocRow>) =>
    setDocs((prev) => prev.map((d, i) => (i === idx ? { ...d, ...patch } : d)))
  const removeDoc = (idx: number) => setDocs((prev) => prev.filter((_, i) => i !== idx))

  const handleSave = () => {
    const socialLinks = Object.fromEntries(
      Object.entries(social).filter(([, v]) => v && v.trim() !== ''),
    )
    const lat = latitude.trim() ? Number(latitude) : null
    const lng = longitude.trim() ? Number(longitude) : null
    updateMutation.mutate({
      phone: phone || null,
      email: email || null,
      description: description || null,
      logoKey: profile?.logoKey ?? null,
      socialLinks: Object.keys(socialLinks).length ? socialLinks : null,
      documents: docs.filter((d) => d.name.trim() !== ''),
      mapUrl: mapUrl || null,
      latitude: Number.isFinite(lat as number) ? lat : null,
      longitude: Number.isFinite(lng as number) ? lng : null,
    })
  }

  const handleReset = () => fillFromProfile(profile)

  // Cheap dirty check: snapshot of the loaded profile vs the live form state.
  // Stable order across both sides means a JSON.stringify diff is fine for the
  // size of this payload (~10 fields + a small docs[] array), and we don't
  // want to lift this into RHF just for a save-bar visibility flag.
  const isDirty = useMemo(() => {
    if (!profile) return false
    const initialSocial = {
      website: profile.socialLinks?.website ?? '',
      telegram: profile.socialLinks?.telegram ?? '',
      instagram: profile.socialLinks?.instagram ?? '',
      youtube: profile.socialLinks?.youtube ?? '',
      facebook: profile.socialLinks?.facebook ?? '',
      twitter: profile.socialLinks?.twitter ?? '',
      linkedin: profile.socialLinks?.linkedin ?? '',
    }
    const initialDocs = (profile.documents ?? []).map((d) => ({
      type: d.type,
      name: d.name,
      fileKey: d.fileKey ?? null,
      validFrom: d.validFrom ?? null,
      validTo: d.validTo ?? null,
    }))
    const initial = {
      phone: profile.phone ?? '',
      email: profile.email ?? '',
      description: profile.description ?? '',
      mapUrl: profile.mapUrl ?? '',
      latitude: profile.latitude != null ? String(profile.latitude) : '',
      longitude: profile.longitude != null ? String(profile.longitude) : '',
      social: initialSocial,
      docs: initialDocs,
    }
    const current = {
      phone,
      email,
      description,
      mapUrl,
      latitude,
      longitude,
      social,
      docs,
    }
    return JSON.stringify(initial) !== JSON.stringify(current)
  }, [profile, phone, email, description, mapUrl, latitude, longitude, social, docs])

  return (
    <>
      <FormSection title={t('Contacts')} icon={<Users className="h-4 w-4" />}>
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="profile-phone">{t('Phone')}</Label>
            <Input
              id="profile-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+998 XX XXX XX XX"
              maxLength={50}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="profile-email">{t('Email')}</Label>
            <Input
              id="profile-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="info@university.uz"
              maxLength={255}
            />
          </div>
          <div className="col-span-full space-y-1.5">
            <Label htmlFor="profile-description">{t('Description')}</Label>
            <Textarea
              id="profile-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('Short description of the university')}
              rows={3}
            />
          </div>
        </div>
      </FormSection>

      <FormSection title={t('Social links')} icon={<Share2 className="h-4 w-4" />}>
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
          {SOCIAL_PLATFORMS.map((p) => (
            <div key={p.key} className="space-y-1.5">
              <Label htmlFor={`social-${p.key}`}>{t(p.labelKey)}</Label>
              <Input
                id={`social-${p.key}`}
                value={social[p.key] ?? ''}
                onChange={(e) => setSocial((s) => ({ ...s, [p.key]: e.target.value }))}
                placeholder={p.placeholder}
              />
            </div>
          ))}
        </div>
      </FormSection>

      <FormSection title={t('Map location')} icon={<MapPin className="h-4 w-4" />}>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="mapUrl">{t('Map URL')}</Label>
            <div className="flex gap-2">
              <Input
                id="mapUrl"
                value={mapUrl}
                onChange={(e) => setMapUrl(e.target.value)}
                placeholder="https://maps.google.com/... | https://yandex.uz/maps/..."
              />
              <button
                type="button"
                onClick={extractCoords}
                disabled={!mapUrl}
                className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium whitespace-nowrap text-blue-600 transition-colors hover:bg-blue-100 disabled:opacity-50 dark:border-blue-900/30 dark:bg-blue-950/20"
              >
                {t('Extract from URL')}
              </button>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              {t('Paste Google Maps or Yandex Maps link')}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="latitude">{t('Latitude')}</Label>
              <Input
                id="latitude"
                type="number"
                step="0.0000001"
                min="-90"
                max="90"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="41.3123456"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="longitude">{t('Longitude')}</Label>
              <Input
                id="longitude"
                type="number"
                step="0.0000001"
                min="-180"
                max="180"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="69.2453456"
              />
            </div>
          </div>
        </div>
      </FormSection>

      <FormSection title={t('Documents')} icon={<FileText className="h-4 w-4" />}>
        <div className="space-y-3">
          {docs.length === 0 && (
            <p className="text-sm text-[var(--text-secondary)]">{t('No documents yet')}</p>
          )}
          {docs.map((doc, idx) => (
            <div
              key={idx}
              className="rounded-lg border border-[var(--border-color-pro)] bg-[var(--table-row-alt)] p-3"
            >
              <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                <div className="space-y-1 md:col-span-3">
                  <Label className="text-xs">{t('Type')}</Label>
                  <Select value={doc.type} onValueChange={(v) => updateDoc(idx, { type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DOCUMENT_TYPES.map((dt) => (
                        <SelectItem key={dt} value={dt}>
                          {t(dt)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1 md:col-span-5">
                  <Label className="text-xs">{t('Name')}</Label>
                  <Input
                    value={doc.name}
                    onChange={(e) => updateDoc(idx, { name: e.target.value })}
                    placeholder={t('Document title')}
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <Label className="text-xs">{t('Valid from')}</Label>
                  <Input
                    type="date"
                    value={doc.validFrom ?? ''}
                    onChange={(e) => updateDoc(idx, { validFrom: e.target.value || null })}
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <Label className="text-xs">{t('Valid to')}</Label>
                  <Input
                    type="date"
                    value={doc.validTo ?? ''}
                    onChange={(e) => updateDoc(idx, { validTo: e.target.value || null })}
                  />
                </div>
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => removeDoc(idx)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 dark:border-red-900/30 dark:bg-red-950/20"
                >
                  <Trash2 className="h-4 w-4" />
                  {t('Remove')}
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addDoc}
            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-100 dark:border-blue-900/30 dark:bg-blue-950/20"
          >
            <Plus className="h-4 w-4" />
            {t('Add document')}
          </button>
        </div>
      </FormSection>

      {/* Sticky save bar — same primitive as the parent form's bar. The bar
          only mounts when the live state differs from the loaded profile, so
          read-mode browsing of this tab is silent. */}
      {isDirty && (
        <div className="sticky bottom-0 z-10 -mx-4 flex items-center gap-3 border-t border-[var(--border-color-pro)] bg-[var(--card-bg)] px-6 py-4 shadow-[0_-4px_6px_-4px_rgba(15,23,42,0.06)]">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-500 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
          </span>
          <div className="ml-auto flex items-center gap-3">
            <button
              type="button"
              onClick={handleReset}
              disabled={updateMutation.isPending}
              className="rounded-lg border border-[var(--border-color-pro)] bg-[var(--card-bg)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--hover-bg)] disabled:opacity-50"
            >
              {t('Reset')}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-5 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-100 disabled:opacity-50 dark:border-blue-900/30 dark:bg-blue-950/20"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('Saving...')}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {t('Save profile')}
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
