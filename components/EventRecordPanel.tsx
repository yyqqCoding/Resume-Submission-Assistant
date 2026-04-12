'use client'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { STATUS_LABEL, type ApplicationEvent } from '@/types'

type Props = {
  event: ApplicationEvent
  value: string
  error: string
  isPending: boolean
  onChange: (value: string) => void
  onSave: () => void
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

export default function EventRecordPanel({
  event,
  value,
  error,
  isPending,
  onChange,
  onSave,
}: Props) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white/80 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-emerald-700">
            {STATUS_LABEL[event.stage]}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {formatHappenedAt(event.happened_at)}
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">
          {event.remark ? '已记录' : '未记录'}
        </span>
      </div>

      <Label htmlFor="event-record" className="mt-4 block text-slate-800">
        当前状态面试记录
      </Label>
      <Textarea
        id="event-record"
        value={value}
        rows={6}
        onChange={(inputEvent) => onChange(inputEvent.target.value)}
        className="mt-2 w-full rounded-3xl text-slate-700"
      />
      {error ? (
        <p role="alert" aria-live="assertive" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      ) : null}
      <Button
        type="button"
        disabled={isPending}
        onClick={onSave}
        className="mt-4 rounded-full"
      >
        {isPending ? '保存中...' : '保存面试记录'}
      </Button>
    </div>
  )
}
