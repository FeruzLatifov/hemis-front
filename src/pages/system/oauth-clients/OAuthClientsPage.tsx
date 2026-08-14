import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { KeyRound, Plus, Power, Trash2, Search } from 'lucide-react'
import {
  useOAuthClients,
  useCreateOAuthClient,
  useToggleOAuthClientStatus,
  useDeleteOAuthClient,
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
import type { OAuthClientAdmin } from '@/types/oauthClient.types'

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
    </div>
  )
}
