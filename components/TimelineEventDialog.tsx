'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { STATUS_LABEL, type ApplicationEvent } from '@/types'
import StatusBadge from './StatusBadge'

type Props = {
  event: ApplicationEvent | null
  open: boolean
  value: string
  error: string
  isPending: boolean
  onChangeAction: (value: string) => void
  onSaveAction: () => void
  onCloseAction: () => void
}

const BUSINESS_TIME_ZONE = 'Asia/Shanghai'

function formatHappenedAt(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: BUSINESS_TIME_ZONE,
  }).format(date)
}

export default function TimelineEventDialog({
  event,
  open,
  value,
  error,
  isPending,
  onChangeAction,
  onSaveAction,
  onCloseAction,
}: Props) {
  if (!event) {
    return null
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onCloseAction()
        }
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="w-[min(92vw,38rem)] gap-0 overflow-hidden border-slate-200 bg-[var(--card)] p-0"
      >
        <div className="border-b border-slate-200/80 bg-gradient-to-br from-emerald-50 via-white to-white px-6 py-5">
          <DialogHeader className="gap-3">
            <div className="flex items-center justify-between gap-4">
              <DialogTitle>{STATUS_LABEL[event.stage]}面试记录</DialogTitle>
              <StatusBadge status={event.stage} />
            </div>
            <DialogDescription className="text-slate-500">
              {formatHappenedAt(event.happened_at)}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="timeline-event-record" className="text-slate-800">
              当前状态面试记录
            </Label>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">
              {event.remark ? '已记录' : '未记录'}
            </span>
          </div>

          <Textarea
            id="timeline-event-record"
            value={value}
            rows={8}
            onChange={(inputEvent) => onChangeAction(inputEvent.target.value)}
            className="w-full resize-none rounded-[1.5rem] text-slate-700"
          />

          {error ? (
            <p
              role="alert"
              aria-live="assertive"
              className="text-sm text-red-600"
            >
              {error}
            </p>
          ) : null}

          <DialogFooter className="border-t border-slate-200/80 pt-4 sm:items-center sm:justify-between">
            <Button type="button" variant="ghost" onClick={onCloseAction}>
              关闭
            </Button>
            <Button
              type="button"
              disabled={isPending}
              onClick={onSaveAction}
              className="rounded-full"
            >
              {isPending ? '保存中...' : '保存面试记录'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
