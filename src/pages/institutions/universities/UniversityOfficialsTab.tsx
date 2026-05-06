/**
 * Officials tab for the University form.
 *
 * Extracted from UniversityFormPage.tsx — owns the officials list, dismissal
 * confirmation, and the appoint-official sub-form (with debounced PINFL lookup).
 */

import { useEffect, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Users } from 'lucide-react'
import { queryKeys } from '@/lib/queryKeys'
import { useDebounce } from '@/hooks/useDebounce'
import { universityApi } from '@/api/university.api'
import {
  useUniversityOfficials,
  useAppointOfficial,
  useRemoveOfficial,
} from '@/hooks/useUniversity'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FormSection } from './UniversityFormShared'

interface OfficialsTabProps {
  code: string
  t: (key: string) => string
}

export function OfficialsTab({ code, t }: OfficialsTabProps) {
  const [view, setView] = useState<'current' | 'history'>('current')
  const { data: allOfficials = [] } = useUniversityOfficials(code, view === 'history')
  const officials =
    view === 'current'
      ? allOfficials.filter((o) => o.current)
      : allOfficials.filter((o) => !o.current)
  const { data: positions = [] } = useQuery({
    queryKey: queryKeys.universities.positions,
    queryFn: ({ signal }) => universityApi.getPositions(signal),
    staleTime: 1000 * 60 * 60,
  })
  const appointMutation = useAppointOfficial(code)
  const removeMutation = useRemoveOfficial(code)
  const [showForm, setShowForm] = useState(false)
  const [pinfl, setPinfl] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [middleName, setMiddleName] = useState('')
  const [phone, setPhone] = useState('')
  const [document, setDocument] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [positionCode, setPositionCode] = useState('')
  const [decreeNumber, setDecreeNumber] = useState('')
  const [lookupStatus, setLookupStatus] = useState<'idle' | 'loading' | 'found' | 'not_found'>(
    'idle',
  )
  const [dismissId, setDismissId] = useState<string | null>(null)
  const [dismissDecree, setDismissDecree] = useState('')

  const resetForm = () => {
    setPinfl('')
    setFirstName('')
    setLastName('')
    setMiddleName('')
    setPhone('')
    setDocument('')
    setBirthDate('')
    setPositionCode('')
    setDecreeNumber('')
    setLookupStatus('idle')
  }

  // PINFL lookup mutation — declarative, with built-in loading/error state.
  // Replaces the prior useEffect-based fetch (CLAUDE.md: no API calls in useEffect).
  const lookupMutation = useMutation({
    mutationFn: ({
      pinfl: lookupPinfl,
      document: lookupDocument,
      birthDate: lookupBirthDate,
    }: {
      pinfl: string
      document?: string
      birthDate?: string
    }) => universityApi.lookupPerson(lookupPinfl, lookupDocument, lookupBirthDate),
    onMutate: () => setLookupStatus('loading'),
    onSuccess: (person) => {
      if (person) {
        if (person.firstName) setFirstName(String(person.firstName))
        if (person.lastName) setLastName(String(person.lastName))
        if (person.middleName) setMiddleName(String(person.middleName))
        if (person.phone) setPhone(String(person.phone))
        setLookupStatus('found')
      } else {
        setLookupStatus('not_found')
      }
    },
    onError: () => setLookupStatus('not_found'),
  })
  const { mutate: triggerLookup, reset: resetLookup } = lookupMutation

  // Auto-lookup on full PINFL — debounced 400ms to avoid mid-typing requests.
  const debouncedPinfl = useDebounce(pinfl, 400)
  useEffect(() => {
    if (debouncedPinfl.length === 14) {
      triggerLookup({ pinfl: debouncedPinfl })
    } else {
      resetLookup()
      setLookupStatus('idle')
    }
  }, [debouncedPinfl, triggerLookup, resetLookup])

  // Tashqi API qidirish (document yoki birthDate bilan) — same mutation, manual trigger.
  const handleExternalLookup = () => {
    if (pinfl.length !== 14 || (!document && !birthDate)) return
    triggerLookup({
      pinfl,
      document: document || undefined,
      birthDate: birthDate || undefined,
    })
  }

  const handleAppoint = () => {
    if (!pinfl || !firstName || !lastName || !positionCode) return
    appointMutation.mutate(
      {
        pinfl,
        firstName,
        lastName,
        middleName: middleName || undefined,
        phone: phone || undefined,
        positionCode,
        decreeNumber: decreeNumber || undefined,
      },
      {
        onSuccess: () => {
          resetForm()
          setShowForm(false)
        },
      },
    )
  }

  return (
    <FormSection title={t('Officials')} icon={<Users className="h-4 w-4" />}>
      <div className="mb-3 flex w-fit gap-1 rounded-lg border border-[var(--border-color-pro)] p-0.5">
        <button
          type="button"
          onClick={() => setView('current')}
          className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${view === 'current' ? 'bg-[var(--card-bg)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
        >
          {t('Current')} ({allOfficials.filter((o) => o.current).length})
        </button>
        <button
          type="button"
          onClick={() => setView('history')}
          className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${view === 'history' ? 'bg-[var(--card-bg)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
        >
          {t('History')}
        </button>
      </div>
      {officials.length > 0 && (
        <div className="mb-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-color-pro)] text-left text-xs text-[var(--text-secondary)]">
                <th className="py-2 pr-3">{t('Position')}</th>
                <th className="py-2 pr-3">{t('Full name')}</th>
                <th className="py-2 pr-3">{t('PINFL')}</th>
                <th className="py-2 pr-3">{t('Phone')}</th>
                <th className="py-2 pr-3">{t('Decree')}</th>
                <th className="py-2 pr-3">{t('Period')}</th>
                <th className="w-16 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {officials.map((o) => (
                <tr
                  key={o.metaId}
                  className={`border-b border-[var(--border-color-pro)] last:border-b-0 ${!o.current ? 'opacity-50' : ''}`}
                >
                  <td className="py-2.5 pr-3 font-medium">{o.positionName || o.positionCode}</td>
                  <td className="py-2.5 pr-3">
                    {o.lastName} {o.firstName} {o.middleName ?? ''}
                  </td>
                  <td className="py-2.5 pr-3 font-mono text-xs">{o.pinfl}</td>
                  <td className="py-2.5 pr-3">{o.phone || '—'}</td>
                  <td className="py-2.5 pr-3 text-xs">{o.decreeNumber || '—'}</td>
                  <td className="py-2.5 pr-3 text-xs">
                    {o.current ? (
                      <span className="text-emerald-600">{o.startDate || ''}</span>
                    ) : (
                      <span className="text-[var(--text-secondary)]">
                        {o.startDate || ''} — {o.endDate || ''}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5">
                    {o.current && dismissId !== o.metaId && (
                      <button
                        type="button"
                        onClick={() => setDismissId(o.metaId)}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        {t('Dismiss')}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* Dismiss confirmation */}
      {dismissId && (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900/30 dark:bg-red-950/10">
          <p className="mb-2 text-sm font-medium text-red-700 dark:text-red-400">
            {t('Dismissal confirmation')}
          </p>
          <div className="flex items-end gap-3">
            <div className="flex-1 space-y-1">
              <Label className="text-xs">{t('Decree number')}</Label>
              <Input
                value={dismissDecree}
                onChange={(e) => setDismissDecree(e.target.value)}
                placeholder="PQ-789"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                removeMutation.mutate(
                  { metaId: dismissId, decree: dismissDecree || undefined },
                  {
                    onSuccess: () => {
                      setDismissId(null)
                      setDismissDecree('')
                    },
                  },
                )
              }}
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
            >
              {t('Confirm dismissal')}
            </button>
            <button
              type="button"
              onClick={() => {
                setDismissId(null)
                setDismissDecree('')
              }}
              className="rounded-lg border border-[var(--border-color-pro)] px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]"
            >
              {t('Cancel')}
            </button>
          </div>
        </div>
      )}

      {view === 'current' &&
        (!showForm ? (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-100 dark:border-blue-900/30 dark:bg-blue-950/20"
          >
            + {t('Appoint official')}
          </button>
        ) : (
          <div className="space-y-3 rounded-lg border border-[var(--border-color-pro)] bg-[var(--app-bg)] p-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="space-y-1">
                <Label>{t('PINFL')} *</Label>
                <Input
                  value={pinfl}
                  onChange={(e) => setPinfl(e.target.value.replace(/\D/g, ''))}
                  placeholder="14 raqam"
                  maxLength={14}
                />
                {lookupStatus === 'loading' && (
                  <p className="text-xs text-blue-500">{t('Searching...')}</p>
                )}
                {lookupStatus === 'found' && (
                  <p className="text-xs text-emerald-600">{t('Person found')}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label>{t('Document')}</Label>
                <Input
                  value={document}
                  onChange={(e) => setDocument(e.target.value.toUpperCase())}
                  placeholder="AA1234567"
                  maxLength={9}
                />
              </div>
              <div className="space-y-1">
                <Label>{t('Birth date')}</Label>
                <Input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                />
              </div>
            </div>
            {lookupStatus === 'not_found' && (document || birthDate) && (
              <button
                type="button"
                onClick={handleExternalLookup}
                className="text-sm text-blue-600 hover:underline"
              >
                {t('Search in external database')}
              </button>
            )}
            {lookupStatus === 'not_found' && !document && !birthDate && (
              <p className="text-xs text-amber-600">
                {t(
                  'Person not found locally. Enter document or birth date to search external database.',
                )}
              </p>
            )}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="space-y-1">
                <Label>{t('Last name')} *</Label>
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>{t('First name')} *</Label>
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>{t('Middle name')}</Label>
                <Input value={middleName} onChange={(e) => setMiddleName(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="space-y-1">
                <Label>{t('Position')} *</Label>
                <Select value={positionCode || undefined} onValueChange={setPositionCode}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('Select')} />
                  </SelectTrigger>
                  <SelectContent>
                    {positions.map((p) => (
                      <SelectItem key={p.code} value={p.code}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>{t('Decree number')}</Label>
                <Input
                  value={decreeNumber}
                  onChange={(e) => setDecreeNumber(e.target.value)}
                  placeholder="PQ-456"
                />
              </div>
              <div className="space-y-1">
                <Label>{t('Phone')}</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+998..."
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleAppoint}
                disabled={
                  !pinfl || !firstName || !lastName || !positionCode || appointMutation.isPending
                }
                className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-100 disabled:opacity-50 dark:border-blue-900/30 dark:bg-blue-950/20"
              >
                {appointMutation.isPending ? t('Saving...') : t('Appoint')}
              </button>
              <button
                type="button"
                onClick={() => {
                  resetForm()
                  setShowForm(false)
                }}
                className="rounded-lg border border-[var(--border-color-pro)] px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]"
              >
                {t('Cancel')}
              </button>
            </div>
          </div>
        ))}
    </FormSection>
  )
}
