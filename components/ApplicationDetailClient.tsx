'use client'

import { startTransition, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  deleteApplication,
  updateApplicationStatus,
  updateLatestEventRemark,
} from '@/app/applications/actions'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { getStatusMenuSide } from '@/lib/status-menu-side'
import {
  ALL_STATUSES,
  STATUS_LABEL,
  type Application,
  type ApplicationEvent,
  type ApplicationStatus,
} from '@/types'
import StatusBadge from './StatusBadge'

type Props = {
  app: Application
  events: ApplicationEvent[]
}

export default function ApplicationDetailClient({ app, events }: Props) {
  const router = useRouter()
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuSide, setMenuSide] = useState<'top' | 'bottom'>('bottom')
  const [currentStatus, setCurrentStatus] = useState(app.status)
  const [remark, setRemark] = useState(events[0]?.remark ?? '')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isStatusPending, setIsStatusPending] = useState(false)
  const [isRemarkPending, setIsRemarkPending] = useState(false)
  const [isDeletePending, setIsDeletePending] = useState(false)
  const [statusError, setStatusError] = useState('')
  const [remarkError, setRemarkError] = useState('')
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    setCurrentStatus(app.status)
  }, [app.status])

  useEffect(() => {
    setRemark(events[0]?.remark ?? '')
  }, [events])

  function handleMenuChange(nextOpen: boolean) {
    if (nextOpen && triggerRef.current) {
      setMenuSide(
        getStatusMenuSide(
          triggerRef.current.getBoundingClientRect(),
          window.innerHeight,
        ),
      )
    }

    setMenuOpen(nextOpen)
  }

  async function handleStatusChange(nextStatus: ApplicationStatus) {
    if (nextStatus === currentStatus) {
      setMenuOpen(false)
      return
    }

    setMenuOpen(false)
    setStatusError('')
    setIsStatusPending(true)

    const result = await updateApplicationStatus(app.id, nextStatus)

    setIsStatusPending(false)

    if (result.error) {
      setStatusError(result.error)
      toast.error(result.error)
      return
    }

    setCurrentStatus(nextStatus)
    toast.success(`状态已更新为${STATUS_LABEL[nextStatus]}`)
    startTransition(() => {
      router.refresh()
    })
  }

  async function handleRemarkSubmit() {
    const trimmedRemark = remark.trim()

    if (!trimmedRemark) {
      setRemarkError('请填写备注内容')
      return
    }

    setRemarkError('')
    setIsRemarkPending(true)

    const result = await updateLatestEventRemark(app.id, trimmedRemark)

    setIsRemarkPending(false)

    if (result.error) {
      setRemarkError(result.error)
      toast.error(result.error)
      return
    }

    toast.success('备注已保存')
    startTransition(() => {
      router.refresh()
    })
  }

  async function handleDelete() {
    setDeleteError('')
    setIsDeletePending(true)

    const result = await deleteApplication(app.id)

    setIsDeletePending(false)

    if (result.error) {
      setDeleteError(result.error)
      toast.error(result.error)
      return
    }

    setDeleteDialogOpen(false)
    toast.success('投递记录已删除')
    router.push('/applications')
  }

  return (
    <section className="rounded-[1.75rem] border border-slate-200/70 bg-[var(--card)] p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">跟进操作</h2>
          <p className="mt-1 text-sm text-slate-500">
            更新当前进展、补充最新备注，或在确认后删除这条记录。
          </p>
        </div>
        <StatusBadge status={currentStatus} />
      </div>

      <div className="mt-5">
        <DropdownMenu open={menuOpen} onOpenChange={handleMenuChange}>
          <DropdownMenuTrigger asChild>
            <Button
              ref={triggerRef}
              type="button"
              variant="secondary"
              disabled={isStatusPending}
              className="rounded-full border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 hover:text-emerald-900"
            >
              {isStatusPending ? '更新中...' : '更新状态'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side={menuSide} align="start">
            {ALL_STATUSES.map((status) => {
              const isCurrent = status === currentStatus

              return (
                <DropdownMenuItem
                  key={status}
                  disabled={isCurrent || isStatusPending}
                  onSelect={() => {
                    void handleStatusChange(status)
                  }}
                >
                  {isCurrent
                    ? `${STATUS_LABEL[status]}（当前）`
                    : STATUS_LABEL[status]}
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>
        {statusError ? (
          <p role="alert" aria-live="assertive" className="mt-3 text-sm text-red-600">
            {statusError}
          </p>
        ) : null}
      </div>

      <div className="mt-8">
        <Label htmlFor="latest-remark" className="text-slate-800">
          最新进展备注
        </Label>
        <Textarea
          id="latest-remark"
          value={remark}
          rows={4}
          onChange={(event) => setRemark(event.target.value)}
          className="mt-2 w-full rounded-3xl text-slate-700"
        />
        {remarkError ? (
          <p role="alert" aria-live="assertive" className="mt-2 text-sm text-red-600">
            {remarkError}
          </p>
        ) : null}
        <Button
          type="button"
          disabled={isRemarkPending}
          variant="default"
          onClick={handleRemarkSubmit}
          className="mt-4 rounded-full"
        >
          {isRemarkPending ? '保存中...' : '保存备注'}
        </Button>
      </div>

      <div className="mt-8 border-t border-slate-200 pt-6">
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <Button
            type="button"
            variant="outline"
            onClick={() => setDeleteDialogOpen(true)}
            className="rounded-full border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-700"
          >
            删除这条投递
          </Button>
          <DialogContent showCloseButton={false}>
            <DialogHeader>
              <DialogTitle>确认删除这条投递？</DialogTitle>
              <DialogDescription>
                删除后将无法恢复，这条投递的时间线和备注也会一并移除。
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={isDeletePending}
                onClick={() => setDeleteDialogOpen(false)}
              >
                取消
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={isDeletePending}
                onClick={() => {
                  void handleDelete()
                }}
              >
                {isDeletePending ? '删除中...' : '确认删除'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {deleteError ? (
          <p role="alert" aria-live="assertive" className="mt-3 text-sm text-red-600">
            {deleteError}
          </p>
        ) : null}
      </div>
    </section>
  )
}
