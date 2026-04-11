'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { startTransition, useEffect, useState } from 'react'
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

export default function ApplicationsClient({ applications }: Props) {
  const router = useRouter()
  const [items, setItems] = useState(applications)
  const [currentFilter, setCurrentFilter] =
    useState<ApplicationStatusFilter>('all')

  useEffect(() => {
    setItems(applications)
  }, [applications])

  const filteredApplications =
    currentFilter === 'all'
      ? items
      : items.filter((application) => application.status === currentFilter)

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
          从第 2 步新增页录入第一条投递记录后，这里会展示完整列表和状态流转。
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
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
            Total
          </p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {items.length}
          </p>
          <p className="mt-1 text-sm text-slate-500">总投递</p>
        </div>

        <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-emerald-700/70">
            Offer
          </p>
          <p className="mt-2 text-3xl font-semibold text-emerald-800">
            {offerCount}
          </p>
          <p className="mt-1 text-sm text-emerald-700">Offer 数</p>
        </div>

        <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
            Rejected
          </p>
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
        <div className="grid gap-4">
          {filteredApplications.map((application) => (
            <ApplicationCard
              key={application.id}
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
          ))}
        </div>
      )}
    </div>
  )
}
