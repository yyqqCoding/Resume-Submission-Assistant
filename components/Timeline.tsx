import type { ReactNode } from 'react'
import { STATUS_LABEL, type ApplicationEvent } from '@/types'

type Props = {
  events: ApplicationEvent[]
  selectedEventId: string | null
  onSelect: (eventId: string | null) => void
  recordPanel?: ReactNode
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

function getRemarkSummary(remark: string | null) {
  if (!remark) {
    return null
  }

  const normalized = remark.replace(/\s+/g, ' ').trim()
  return normalized.length > 24 ? `${normalized.slice(0, 24)}...` : normalized
}

export default function Timeline({
  events,
  selectedEventId,
  onSelect,
  recordPanel,
}: Props) {
  if (!events.length) {
    return (
      <section className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white/70 p-6">
        <h2 className="text-base font-semibold text-slate-900">状态时间线</h2>
        <p className="mt-3 text-sm text-slate-500">还没有状态记录</p>
      </section>
    )
  }

  return (
    <section className="rounded-[1.75rem] border border-slate-200/70 bg-[var(--card)] p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
      <h2 className="text-base font-semibold text-slate-900">状态时间线</h2>
      <ol className="mt-5 space-y-4">
        {events.map((event, index) => {
          const isSelected = event.id === selectedEventId
          const isLatest = index === 0
          const summary = getRemarkSummary(event.remark)

          return (
            <li
              key={event.id}
              data-testid={`timeline-row-${event.id}`}
              className={`grid gap-3 ${
                isSelected && recordPanel
                  ? 'grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,24rem)]'
                  : 'grid-cols-1'
              }`}
            >
              <button
                type="button"
                data-testid={`timeline-item-${event.id}`}
                data-selected={isSelected}
                onClick={() => onSelect(isSelected ? null : event.id)}
                className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                  isSelected
                    ? 'border-emerald-300 bg-emerald-50 shadow-[0_16px_40px_rgba(16,185,129,0.14)]'
                    : isLatest
                      ? 'border-emerald-200 bg-emerald-50/70'
                      : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-semibold text-slate-900">
                    {STATUS_LABEL[event.stage]}
                  </span>
                  <span className="text-xs text-slate-500">
                    {formatHappenedAt(event.happened_at)}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-xs font-medium text-slate-500">
                    {event.remark ? '已记录' : '未记录'}
                  </span>
                  {summary ? (
                    <span className="text-xs text-slate-500">{summary}</span>
                  ) : null}
                </div>
              </button>
              {isSelected && recordPanel ? (
                <div
                  data-testid="timeline-record-panel-slot"
                  className="min-w-0"
                >
                  {recordPanel}
                </div>
              ) : null}
            </li>
          )
        })}
      </ol>
    </section>
  )
}
