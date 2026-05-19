import { useState, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Plus,
  RefreshCw,
  Search,
  Send,
  KeyRound,
  Trash2,
  Pencil,
  History,
  Copy,
  Check,
  AlertTriangle,
} from 'lucide-react'
import {
  useWebhooksList,
  useDeleteWebhook,
  useRegenerateWebhookSecret,
  useSendWebhookTest,
} from '@/hooks/useWebhooks'
import { useAuthStore } from '@/stores/authStore'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import type { WebhookTargetDto, WebhookSecretResponse } from '@/types/webhook.types'
import WebhookFormDialog from './components/WebhookFormDialog'
import WebhookDeliveriesDrawer from './components/WebhookDeliveriesDrawer'

type DialogState =
  | { type: 'idle' }
  | { type: 'create' }
  | { type: 'edit'; target: WebhookTargetDto }
  | { type: 'delete'; target: WebhookTargetDto }
  | { type: 'regenerate'; target: WebhookTargetDto }
  | { type: 'secret'; secret: WebhookSecretResponse }
  | { type: 'deliveries'; target: WebhookTargetDto }

export default function WebhooksPage() {
  const { t } = useTranslation()
  const { permissions } = useAuthStore()

  const canView = permissions.includes('webhook.view')
  const canCreate = permissions.includes('webhook.create')
  const canUpdate = permissions.includes('webhook.update')
  const canDelete = permissions.includes('webhook.delete')
  const canManage = permissions.includes('webhook.manage')

  const { data, isLoading, refetch, isFetching } = useWebhooksList()
  const deleteMutation = useDeleteWebhook()
  const regenMutation = useRegenerateWebhookSecret()
  const testMutation = useSendWebhookTest()

  const [search, setSearch] = useState('')
  const [dialog, setDialog] = useState<DialogState>({ type: 'idle' })
  const closeDialog = useCallback(() => setDialog({ type: 'idle' }), [])

  const targets = useMemo(() => data ?? [], [data])

  const filtered = useMemo(() => {
    if (!search.trim()) return targets
    const q = search.toLowerCase()
    return targets.filter(
      (t) =>
        t.universityCode.toLowerCase().includes(q) ||
        (t.description ?? '').toLowerCase().includes(q) ||
        (t.callbackUrl ?? '').toLowerCase().includes(q),
    )
  }, [targets, search])

  if (!canView) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-500">
        {t('You do not have permission to view this page')}
      </div>
    )
  }

  return (
    <div className="space-y-4 p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{t('Webhook Targets')}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {t('Manage 224 OTM Univer webhook URLs, secrets and delivery logs')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            title={t('Refresh')}
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            {t('Refresh')}
          </button>
          {canCreate && (
            <button
              onClick={() => setDialog({ type: 'create' })}
              className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-100"
            >
              <Plus className="h-4 w-4" />
              {t('Add Webhook Target')}
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('Search by university code or URL...')}
          className="pl-9"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label={t('Total targets')} value={targets.length} tone="slate" />
        <StatCard
          label={t('Active')}
          value={targets.filter((t) => t.active).length}
          tone="emerald"
        />
        <StatCard
          label={t('Inactive')}
          value={targets.filter((t) => !t.active).length}
          tone="amber"
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full">
          <thead className="bg-slate-50 text-left text-xs font-medium tracking-wider text-slate-500 uppercase">
            <tr>
              <th className="px-4 py-3">{t('OTM Code')}</th>
              <th className="px-4 py-3">{t('Callback URL')}</th>
              <th className="px-4 py-3">{t('Status')}</th>
              <th className="px-4 py-3">{t('Timeout')}</th>
              <th className="px-4 py-3">{t('Retries')}</th>
              <th className="px-4 py-3 text-right">{t('Actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <Skeleton className="h-5 w-full" />
                    </td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                  {search
                    ? t('No webhook targets found for the search')
                    : t('No webhook targets configured yet')}
                </td>
              </tr>
            ) : (
              filtered.map((target) => (
                <tr key={target.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{target.universityCode}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">
                    <span className="block max-w-md truncate" title={target.callbackUrl ?? ''}>
                      {target.callbackUrl ?? '—'}
                    </span>
                    {target.description && (
                      <span className="mt-0.5 block text-[11px] text-slate-400">
                        {target.description}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant="outline"
                      className={
                        target.active
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-amber-200 bg-amber-50 text-amber-700'
                      }
                    >
                      {target.active ? t('Active') : t('Inactive')}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {target.timeoutMs ? `${target.timeoutMs} ms` : '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{target.maxRetries ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <IconButton
                        title={t('Delivery log')}
                        onClick={() => setDialog({ type: 'deliveries', target })}
                      >
                        <History className="h-4 w-4" />
                      </IconButton>
                      {canManage && (
                        <IconButton
                          title={t('Send test event')}
                          disabled={testMutation.isPending}
                          onClick={() => testMutation.mutate(target.id)}
                        >
                          <Send className="h-4 w-4" />
                        </IconButton>
                      )}
                      {canManage && (
                        <IconButton
                          title={t('Regenerate secret')}
                          onClick={() => setDialog({ type: 'regenerate', target })}
                        >
                          <KeyRound className="h-4 w-4" />
                        </IconButton>
                      )}
                      {canUpdate && (
                        <IconButton
                          title={t('Edit')}
                          onClick={() => setDialog({ type: 'edit', target })}
                        >
                          <Pencil className="h-4 w-4" />
                        </IconButton>
                      )}
                      {canDelete && (
                        <IconButton
                          title={t('Delete')}
                          tone="danger"
                          onClick={() => setDialog({ type: 'delete', target })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </IconButton>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit dialog */}
      {(dialog.type === 'create' || dialog.type === 'edit') && (
        <WebhookFormDialog
          mode={dialog.type}
          initial={dialog.type === 'edit' ? dialog.target : undefined}
          onClose={closeDialog}
          onCreated={(secret) => setDialog({ type: 'secret', secret })}
        />
      )}

      {/* Delete confirm */}
      <AlertDialog open={dialog.type === 'delete'} onOpenChange={(open) => !open && closeDialog()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('Delete webhook target?')}</AlertDialogTitle>
            <AlertDialogDescription>
              {dialog.type === 'delete' &&
                t('OTM {{code}} will stop receiving webhooks. Soft delete — restorable.', {
                  code: dialog.target.universityCode,
                })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('Cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (dialog.type === 'delete') {
                  deleteMutation.mutate(dialog.target.id, {
                    onSuccess: closeDialog,
                    onError: closeDialog,
                  })
                }
              }}
            >
              {t('Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Regenerate confirm */}
      <AlertDialog
        open={dialog.type === 'regenerate'}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('Regenerate webhook secret?')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                'Old secret will be invalidated immediately. New secret must be deployed to Univer .env before next event.',
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('Cancel')}</AlertDialogCancel>
            <AlertDialogAction
              disabled={regenMutation.isPending}
              onClick={() => {
                if (dialog.type === 'regenerate') {
                  regenMutation.mutate(dialog.target.id, {
                    onSuccess: (secret) => setDialog({ type: 'secret', secret }),
                  })
                }
              }}
            >
              {t('Regenerate')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Secret reveal */}
      {dialog.type === 'secret' && (
        <SecretRevealDialog secret={dialog.secret} onClose={closeDialog} />
      )}

      {/* Deliveries drawer */}
      {dialog.type === 'deliveries' && (
        <WebhookDeliveriesDrawer target={dialog.target} onClose={closeDialog} />
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: 'slate' | 'emerald' | 'amber'
}) {
  const toneClass: Record<string, string> = {
    slate: 'border-slate-200 text-slate-700',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
  }
  return (
    <div className={`rounded-lg border bg-white p-4 ${toneClass[tone]}`}>
      <div className="text-xs font-medium tracking-wider uppercase opacity-70">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  )
}

function IconButton({
  children,
  onClick,
  title,
  disabled,
  tone = 'default',
}: {
  children: React.ReactNode
  onClick?: () => void
  title?: string
  disabled?: boolean
  tone?: 'default' | 'danger'
}) {
  const cls =
    tone === 'danger' ? 'text-red-600 hover:bg-red-50' : 'text-slate-600 hover:bg-slate-100'
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-8 w-8 items-center justify-center rounded ${cls} disabled:cursor-not-allowed disabled:opacity-50`}
    >
      {children}
    </button>
  )
}

function SecretRevealDialog({
  secret,
  onClose,
}: {
  secret: WebhookSecretResponse
  onClose: () => void
}) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(secret.plainSecret)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // ignore
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-amber-600" />
            {t('Webhook secret — copy now')}
          </DialogTitle>
          <DialogDescription>
            {t(
              'OTM {{code}} — this plain secret is shown only once. Save it to Univer .env as HEMIS_WEBHOOK_SECRET.',
              { code: secret.universityCode },
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-3">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <div>{secret.warning}</div>
            </div>
          </div>

          <div className="relative">
            <pre className="overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 p-3 pr-12 font-mono text-xs text-slate-800">
              {secret.plainSecret}
            </pre>
            <button
              type="button"
              onClick={copyToClipboard}
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
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {t('I saved it — close')}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
