'use client'

import { startTransition, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  deleteApplication,
  updateEventInterviewRecord,
  updateApplicationStatus,
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
import { getStatusMenuSide } from '@/lib/status-menu-side'
import {
  ALL_STATUSES,
  STATUS_LABEL,
  type Application,
  type ApplicationEvent,
  type ApplicationStatus,
} from '@/types'
import StatusBadge from './StatusBadge'
import Timeline from './Timeline'
import TimelineEventDialog from './TimelineEventDialog'

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
  const [items, setItems] = useState(events)
  const [selectedEventId, setSelectedEventId] = useState<string | null>(
    events[0]?.id ?? null,
  )
  const [dialogOpen, setDialogOpen] = useState(false)
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
    setItems(events)
    setSelectedEventId((currentSelectedEventId) => {
      if (!events.length) {
        return null
      }

      if (
        currentSelectedEventId &&
        events.some((event) => event.id === currentSelectedEventId)
      ) {
        return currentSelectedEventId
      }

      return events[0]?.id ?? null
    })
  }, [events])

  const selectedEvent =
    items.find((event) => event.id === selectedEventId) ?? null

  useEffect(() => {
    setRemark(selectedEvent?.remark ?? '')
    setRemarkError('')
  }, [selectedEvent?.id, selectedEvent?.remark])

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

  function handleTimelineSelect(eventId: string | null) {
    if (!eventId) {
      return
    }

    setSelectedEventId(eventId)
    setDialogOpen(true)
  }

  function handleDialogClose() {
    setDialogOpen(false)
    setRemarkError('')
  }

  async function handleRemarkSubmit() {
    if (!selectedEvent) {
      setRemarkError('请先选择一个状态节点')
      return
    }

    const trimmedRemark = remark.trim()

    if (!trimmedRemark) {
      setRemarkError('请填写面试记录')
      return
    }

    setRemarkError('')
    setIsRemarkPending(true)

    const result = await updateEventInterviewRecord(selectedEvent.id, trimmedRemark)

    setIsRemarkPending(false)

    if (result.error) {
      setRemarkError(result.error)
      toast.error(result.error)
      return
    }

    setItems((currentItems) =>
      currentItems.map((event) =>
        event.id === selectedEvent.id ? { ...event, remark: trimmedRemark } : event,
      ),
    )

    toast.success('面试记录已保存')
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
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <Timeline
        events={items}
        selectedEventId={selectedEventId}
        onSelect={handleTimelineSelect}
      />

      <TimelineEventDialog
        event={selectedEvent}
        open={dialogOpen && !!selectedEvent}
        value={remark}
        error={remarkError}
        isPending={isRemarkPending}
        onChangeAction={setRemark}
        onSaveAction={() => {
          void handleRemarkSubmit()
        }}
        onCloseAction={handleDialogClose}
      />

      <section
        data-testid="detail-action-sidebar"
        className="rounded-[1.75rem] border border-slate-200/70 bg-[var(--card)] p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)]"
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">跟进操作</h2>
            <p className="mt-1 text-sm text-slate-500">
              更新当前进展，或在确认后删除这条记录。
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
            <p
              role="alert"
              aria-live="assertive"
              className="mt-3 text-sm text-red-600"
            >
              {statusError}
            </p>
          ) : null}
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
                  删除后将无法恢复，这条投递的时间线和面试记录也会一并移除。
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
            <p
              role="alert"
              aria-live="assertive"
              className="mt-3 text-sm text-red-600"
            >
              {deleteError}
            </p>
          ) : null}
        </div>
      </section>
    </div>
  )
}
