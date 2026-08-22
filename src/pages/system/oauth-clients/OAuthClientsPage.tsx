import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AlertTriangle,
  Check,
  Copy,
  KeyRound,
  Plus,
  Power,
  RotateCw,
  Search,
  Trash2,
} from 'lucide-react'
import {
  useOAuthClients,
  useCreateOAuthClient,
  useToggleOAuthClientStatus,
  useDeleteOAuthClient,
  useRotateOAuthClientSecret,
} from '@/hooks/useOAuthClients'
import { useUniversities } from '@/hooks/useUniversities'
import { usePermission } from '@/hooks/usePermission'
import { SearchableSelect, ALL_VALUE } from '@/components/filters/SearchableSelect'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'
import { copyToClipboard } from '@/lib/clipboard'
import { assessSecret, SECRET_MIN_LENGTH, type SecretIssue } from '@/lib/secretStrength'
import { toast } from 'sonner'
import type { OAuthClientAdmin, OAuthClientSecretResponse } from '@/types/oauthClient.types'

export default function OAuthClientsPage() {
  const { t } = useTranslation()
  const { canAny } = usePermission()
  const canManage = canAny(['oauth-clients.manage'])

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const size = 20

  const { data, isLoading } = useOAuthClients({ search, page, size, sort: 'clientId,asc' })
  const clients = useMemo(() => data?.content ?? [], [data?.content])

  const { data: universitiesData } = useUniversities({ page: 0, size: 1000, sort: 'name,asc' })
  const universityOptions = useMemo(
    () => (universitiesData?.content ?? []).map((u) => ({ code: u.code, name: u.name })),
    [universitiesData?.content],
  )

  const createMutation = useCreateOAuthClient()
  const toggleMutation = useToggleOAuthClientStatus()
  const deleteMutation = useDeleteOAuthClient()

  // Create dialog form
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState({
    clientId: '',
    clientSecret: '',
    universityCode: '',
    clientName: '',
    active: true,
  })
  const resetForm = () =>
    setForm({ clientId: '', clientSecret: '', universityCode: '', clientName: '', active: true })
  const canSubmit =
    form.clientId.trim() && form.clientSecret.trim().length >= 4 && form.universityCode

  const [deleteTarget, setDeleteTarget] = useState<OAuthClientAdmin | null>(null)

  // Sir rotatsiyasi: tanlov dialogi -> (markaz generatsiya qilsa) bir martalik ko'rsatish dialogi
  const rotateMutation = useRotateOAuthClientSecret()
  const [rotateTarget, setRotateTarget] = useState<OAuthClientAdmin | null>(null)
  const [rotateManual, setRotateManual] = useState(false)
  const [manualSecret, setManualSecret] = useState('')
  const [manualConfirm, setManualConfirm] = useState('')
  const [revealed, setRevealed] = useState<OAuthClientSecretResponse | null>(null)

  const closeRotate = () => {
    setRotateTarget(null)
    setRotateManual(false)
    setManualSecret('')
    setManualConfirm('')
  }

  // Baho client_id'ni ham biladi: sir uning ichida bo'lsa taxmin qilinadigan bo'lib qoladi.
  const assessment = useMemo(
    () => assessSecret(manualSecret.trim(), rotateTarget?.clientId),
    [manualSecret, rotateTarget?.clientId],
  )
  const confirmTouched = manualConfirm.length > 0
  const confirmMismatch = confirmTouched && manualSecret.trim() !== manualConfirm.trim()

  const canRotate = !rotateManual || (!assessment.blocked && confirmTouched && !confirmMismatch)

  const submitRotate = () => {
    if (!rotateTarget) return
    rotateMutation.mutate(
      { id: rotateTarget.id, clientSecret: rotateManual ? manualSecret.trim() : undefined },
      {
        onSuccess: (result) => {
          closeRotate()
          // Markaz generatsiya qilgan bo'lsa — ochiq sir FAQAT shu javobda keldi, ko'rsatamiz.
          // Admin o'z qiymatini bergan bo'lsa ko'rsatadigan narsa yo'q, oddiy tasdiq yetadi.
          if (result.plainSecret) setRevealed(result)
          else toast.success(t('Secret changed'))
        },
      },
    )
  }

  const submitCreate = () => {
    createMutation.mutate(
      {
        clientId: form.clientId.trim(),
        clientSecret: form.clientSecret,
        universityCode: form.universityCode,
        clientName: form.clientName.trim() || undefined,
        active: form.active,
      },
      {
        onSuccess: () => {
          setCreateOpen(false)
          resetForm()
        },
      },
    )
  }

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-[var(--text-secondary)]" />
          <h1 className="text-xl font-semibold">{t('Integration accounts')}</h1>
          <Badge variant="secondary">{data?.totalElements ?? 0}</Badge>
        </div>
        {canManage && (
          <Button
            onClick={() => {
              resetForm()
              setCreateOpen(true)
            }}
          >
            <Plus className="mr-1 h-4 w-4" /> {t('Create')}
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(0)
          }}
          placeholder={t('Search')}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('Client ID')}</TableHead>
              <TableHead>{t('Name')}</TableHead>
              <TableHead>{t('University')}</TableHead>
              <TableHead>{t('Status')}</TableHead>
              <TableHead>{t('Last used')}</TableHead>
              {canManage && <TableHead className="text-right">{t('Actions')}</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-[var(--text-secondary)]">
                  {t('Loading...')}
                </TableCell>
              </TableRow>
            ) : clients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-[var(--text-secondary)]">
                  {t('No data found')}
                </TableCell>
              </TableRow>
            ) : (
              clients.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono text-sm">{c.clientId}</TableCell>
                  <TableCell>{c.clientName}</TableCell>
                  <TableCell>{c.universityName ?? c.universityCode ?? '—'}</TableCell>
                  <TableCell>
                    <Badge variant={c.active ? 'default' : 'secondary'}>
                      {c.active ? t('Active') : t('Inactive')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-[var(--text-secondary)]">
                    {c.lastUsedAt ? new Date(c.lastUsedAt).toLocaleString() : '—'}
                  </TableCell>
                  {canManage && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          title={c.active ? t('Disable') : t('Enable')}
                          disabled={toggleMutation.isPending}
                          onClick={() => toggleMutation.mutate(c.id)}
                        >
                          <Power className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          title={t('Rotate secret')}
                          disabled={rotateMutation.isPending}
                          onClick={() => {
                            setRotateManual(false)
                            setManualSecret('')
                            setRotateTarget(c)
                          }}
                        >
                          <RotateCw className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          title={t('Delete')}
                          className="text-red-600 hover:text-red-700"
                          onClick={() => setDeleteTarget(c)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {(data?.totalPages ?? 0) > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 0}
            onClick={() => setPage((p) => p - 1)}
          >
            ‹
          </Button>
          <span className="text-sm text-[var(--text-secondary)]">
            {page + 1} / {data?.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page + 1 >= (data?.totalPages ?? 1)}
            onClick={() => setPage((p) => p + 1)}
          >
            ›
          </Button>
        </div>
      )}

      {/* Create dialog */}
      <Dialog
        open={createOpen}
        onOpenChange={(o) => {
          if (!o) {
            setCreateOpen(false)
            resetForm()
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t('Integration accounts')} — {t('Create')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>{t('Client ID')} (Login)</Label>
              <Input
                value={form.clientId}
                onChange={(e) => setForm((f) => ({ ...f, clientId: e.target.value }))}
                placeholder="otm999"
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t('Client secret')} (Parol)</Label>
              <Input
                value={form.clientSecret}
                onChange={(e) => setForm((f) => ({ ...f, clientSecret: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t('University')}</Label>
              <SearchableSelect
                className="w-full"
                value={form.universityCode || ALL_VALUE}
                onChange={(val) =>
                  setForm((f) => ({ ...f, universityCode: val === ALL_VALUE ? '' : val }))
                }
                options={universityOptions}
                placeholder={t('Select university')}
                allLabel={t('Select university')}
                searchPlaceholder={t('Search')}
                emptyLabel={t('No data found')}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={form.active}
                onCheckedChange={(v) => setForm((f) => ({ ...f, active: v === true }))}
              />
              {t('Active')}
            </label>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateOpen(false)
                resetForm()
              }}
            >
              {t('Cancel')}
            </Button>
            <Button onClick={submitCreate} disabled={!canSubmit || createMutation.isPending}>
              {t('Create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('Delete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget ? `${deleteTarget.clientId} — ${deleteTarget.clientName}` : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>{t('Cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (deleteTarget)
                  deleteMutation.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) })
              }}
            >
              {t('Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Sirni almashtirish — tanlov */}
      <Dialog open={!!rotateTarget} onOpenChange={(o) => !o && closeRotate()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCw className="h-5 w-5 text-[var(--text-secondary)]" />
              {t('Rotate secret')}
            </DialogTitle>
            <DialogDescription>
              {rotateTarget ? `${rotateTarget.clientId} — ${rotateTarget.clientName}` : ''}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="flex gap-2">
              <Button
                type="button"
                variant={rotateManual ? 'outline' : 'default'}
                className="flex-1"
                onClick={() => {
                  setRotateManual(false)
                  setManualSecret('')
                  setManualConfirm('')
                }}
              >
                {t('Generate automatically')}
              </Button>
              <Button
                type="button"
                variant={rotateManual ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setRotateManual(true)}
              >
                {t('Enter manually')}
              </Button>
            </div>

            {rotateManual && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="rotate-secret">{t('New secret')}</Label>
                  <Input
                    id="rotate-secret"
                    type="text"
                    value={manualSecret}
                    onChange={(e) => setManualSecret(e.target.value)}
                    autoComplete="off"
                    spellCheck={false}
                    className="font-mono"
                  />
                  {manualSecret.trim().length > 0 && (
                    <SecretStrengthMeter
                      value={manualSecret.trim()}
                      clientId={rotateTarget?.clientId}
                    />
                  )}
                  {manualSecret.trim().length === 0 && (
                    <p className="text-xs text-[var(--text-secondary)]">
                      {t('At least {{n}} characters', { n: SECRET_MIN_LENGTH })}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="rotate-secret-confirm">{t('Repeat new secret')}</Label>
                  <Input
                    id="rotate-secret-confirm"
                    type="text"
                    value={manualConfirm}
                    onChange={(e) => setManualConfirm(e.target.value)}
                    autoComplete="off"
                    spellCheck={false}
                    className={`font-mono ${confirmMismatch ? 'border-red-500' : ''}`}
                  />
                  {confirmMismatch && (
                    <p className="text-xs text-red-600">{t('Secrets do not match')}</p>
                  )}
                </div>
              </div>
            )}

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <div>
                  {t(
                    'Already-issued tokens stay valid for up to 24 hours. Rotating or disabling only blocks new tokens.',
                  )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeRotate} disabled={rotateMutation.isPending}>
              {t('Cancel')}
            </Button>
            <Button onClick={submitRotate} disabled={!canRotate || rotateMutation.isPending}>
              {t('Rotate secret')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Yangi sir — bir martalik ko'rsatish */}
      {revealed && <SecretRevealDialog secret={revealed} onClose={() => setRevealed(null)} />}
    </div>
  )
}

/**
 * Qo'lda kiritilgan sirning mustahkamligi.
 *
 * Baho tarkib qoidalariga emas, ENTROPIYAGA tayanadi ({@link assessSecret}) — mashina
 * kredensiali uchun uzunlik va tasodifiylik muhim, "bitta bosh harf" talabi emas.
 * Taqqoslash uchun avtomatik generatsiya ~288 bit beradi.
 */
function SecretStrengthMeter({ value, clientId }: { value: string; clientId?: string }) {
  const { t } = useTranslation()
  const { strength, score, entropyBits, issues } = useMemo(
    () => assessSecret(value, clientId),
    [value, clientId],
  )

  const tone = {
    weak: { bar: 'bg-red-500', text: 'text-red-600', label: t('Weak') },
    fair: { bar: 'bg-amber-500', text: 'text-amber-600', label: t('Fair') },
    strong: { bar: 'bg-emerald-500', text: 'text-emerald-600', label: t('Strong') },
  }[strength]

  const issueLabel: Record<SecretIssue, string> = {
    tooShort: t('At least {{n}} characters', { n: SECRET_MIN_LENGTH }),
    containsClientId: t('Must not contain the Client ID'),
    commonWord: t('Avoid guessable words like admin, password or test'),
    lowEntropy: t('Not complex enough — make it longer or more random'),
    repeated: t('Too many repeated characters'),
    sequential: t('Avoid sequences like abcd or 1234'),
    singleClass: t('Mix letters, digits and symbols'),
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--surface-muted,#e5e7eb)]">
          <div
            className={`h-full rounded-full transition-all ${tone.bar}`}
            style={{ width: `${Math.max(score, 4)}%` }}
          />
        </div>
        <span className={`text-xs font-medium ${tone.text}`}>{tone.label}</span>
      </div>
      <p className="text-xs text-[var(--text-secondary)]">
        {t('Estimated entropy: {{bits}} bits', { bits: entropyBits })}
      </p>
      {issues.length > 0 && (
        <ul className="list-inside list-disc space-y-0.5">
          {issues.map((i) => (
            <li key={i} className="text-xs text-amber-700">
              {issueLabel[i]}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/**
 * Markaz generatsiya qilgan sirni BIR MARTA ko'rsatadi.
 *
 * Nusxalash uchun `@/lib/clipboard` ishlatiladi, xom `navigator.clipboard` emas: admin panel
 * HTTP orqali ham ochiladi (masalan http://172.18.9.1:43434), u yerda `navigator.clipboard`
 * mavjud emas va nusxalash jimgina ishlamay qo'yardi.
 */
function SecretRevealDialog({
  secret,
  onClose,
}: {
  secret: OAuthClientSecretResponse
  onClose: () => void
}) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const ok = await copyToClipboard(secret.plainSecret ?? '')
    if (!ok) {
      toast.error(t('Copy failed'))
      return
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-amber-600" />
            {t('New secret — copy now')}
          </DialogTitle>
          <DialogDescription>
            {secret.clientId}
            {secret.secretVersion ? ` · v${secret.secretVersion}` : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 space-y-3">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <div>{secret.warning}</div>
            </div>
          </div>

          <div className="relative">
            <pre className="overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 p-3 pr-20 font-mono text-xs text-slate-800">
              {secret.plainSecret}
            </pre>
            <button
              type="button"
              onClick={handleCopy}
              className="absolute top-2 right-2 inline-flex h-7 items-center gap-1 rounded border border-slate-300 bg-white px-2 text-xs text-slate-700 hover:bg-slate-100"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 text-emerald-600" />
                  {t('Copied')}
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  {t('Copy')}
                </>
              )}
            </button>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose}>{t('Close')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
