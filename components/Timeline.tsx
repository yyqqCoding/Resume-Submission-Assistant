import { STATUS_LABEL, type ApplicationEvent } from '@/types'

type Props = {
  events: ApplicationEvent[]
}

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
  }).format(date)
}

export default function Timeline({ events }: Props) {
  if (!events.length) {
    return (
      <section className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white/70 p-6">
        <h2 className="text-base font-semibold text-slate-900">状态时间线</h2>
        <p className="mt-3 text-sm text-slate-500">还没有时间线记录</p>
      </section>
    )
  }

  return (
    <section className="rounded-[1.75rem] border border-slate-200/70 bg-[var(--card)] p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
      <h2 className="text-base font-semibold text-slate-900">状态时间线</h2>
      <ol className="mt-5 space-y-4">
        {events.map((event, index) => {
          const isLatest = index === 0

          return (
            <li
              key={event.id}
              data-testid={`timeline-item-${event.id}`}
              className={`rounded-2xl border px-4 py-4 ${
                isLatest
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
              {event.remark ? (
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {event.remark}
                </p>
              ) : null}
            </li>
          )
        })}
      </ol>
    </section>
  )
}
