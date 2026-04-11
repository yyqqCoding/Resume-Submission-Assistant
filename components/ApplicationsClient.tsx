'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { startTransition, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import type {
  Application,
  ApplicationStatus,
  ApplicationStatusFilter,
} from '@/types'
import ApplicationCard from './ApplicationCard'
import StatusFilter from './StatusFilter'

type Props = {
  applications: Application[]
}

const STACK_TOP_OFFSET_REM = 1.05

export default function ApplicationsClient({ applications }: Props) {
  const router = useRouter()
  const [items, setItems] = useState(applications)
  const [currentFilter, setCurrentFilter] = useState<ApplicationStatusFilter>('all')
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    setItems(applications)
  }, [applications])

  const filteredApplications =
    currentFilter === 'all'
      ? items
      : items.filter((application) => application.status === currentFilter)
  const hasActiveCard = activeId !== null

  useEffect(() => {
    if (!filteredApplications.length) {
      setActiveId(null)
      return
    }

    if (activeId && !filteredApplications.some((item) => item.id === activeId)) {
      setActiveId(null)
    }
  }, [activeId, filteredApplications])

  const offerCount = items.filter(
    (application) => application.status === 'offer',
  ).length
  const rejectedCount = items.filter(
    (application) => application.status === 'rejected',
  ).length

  if (items.length === 0) {
    return (
      <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white/70 px-6 py-10 text-center">
        <p className="text-lg font-semibold text-slate-900">还没有投递记录</p>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          从“新增投递”开始建立第一条记录后，这里会持续汇总你的进展。
        </p>
        <Link
          href="/applications/new"
          className="mt-5 inline-flex items-center rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600"
        >
          去新增第一条投递
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">总投递</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {items.length}
          </p>
          <p className="mt-1 text-sm text-slate-500">总投递</p>
        </div>

        <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-emerald-700/70">Offer</p>
          <p className="mt-2 text-3xl font-semibold text-emerald-800">
            {offerCount}
          </p>
          <p className="mt-1 text-sm text-emerald-700">Offer 数</p>
        </div>

        <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">已拒</p>
          <p className="mt-2 text-3xl font-semibold text-slate-700">
            {rejectedCount}
          </p>
          <p className="mt-1 text-sm text-slate-500">已拒数量</p>
        </div>
      </div>

      <StatusFilter current={currentFilter} onChange={setCurrentFilter} />

      {filteredApplications.length === 0 ? (
        <div className="rounded-[1.75rem] border border-slate-200 bg-white px-6 py-10 text-center">
          <p className="text-lg font-semibold text-slate-900">该状态下暂无记录</p>
          <p className="mt-3 text-sm text-slate-500">
            切换筛选条件，或者先继续推进当前正在进行的投递。
          </p>
        </div>
      ) : (
        <div
          role="region"
          aria-label="投递记录列表"
          className="scrollbar-hidden rounded-[1.75rem] border border-slate-200/70 bg-white/45 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] backdrop-blur-sm lg:max-h-[min(66vh,48rem)] lg:overflow-y-auto lg:overscroll-contain lg:p-3 lg:pr-2"
        >
          <div className="space-y-4 lg:space-y-0 lg:pb-6">
            {filteredApplications.map((application, index) => (
              <div
                key={application.id}
                data-testid="stacked-card-shell"
                data-stack-index={index}
                data-stack-active={application.id === activeId}
                onClick={() => setActiveId(application.id)}
                onFocusCapture={() => setActiveId(application.id)}
                className={cn(
                  'relative transition-[transform,filter,opacity,box-shadow] duration-200',
                  'lg:sticky',
                  index === 0 ? 'lg:mt-0' : 'lg:-mt-14',
                  application.id === activeId
                    ? 'lg:-translate-y-1 lg:scale-[1.01] lg:drop-shadow-[0_20px_50px_rgba(15,23,42,0.14)]'
                    : hasActiveCard
                      ? 'lg:scale-[0.995]'
                      : '',
                )}
                style={{
                  top: `${1 + index * STACK_TOP_OFFSET_REM}rem`,
                  zIndex:
                    application.id === activeId
                      ? filteredApplications.length + 20
                      : index + 1,
                }}
              >
                <ApplicationCard
                  app={application}
                  onStatusUpdated={(nextStatus: ApplicationStatus) => {
                    setItems((current) =>
                      current.map((item) =>
                        item.id === application.id
                          ? {
                              ...item,
                              status: nextStatus,
                            }
                          : item,
                      ),
                    )
                    startTransition(() => {
                      router.refresh()
                    })
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
