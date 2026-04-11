'use client'

import { startTransition, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  deleteApplication,
  updateApplicationStatus,
  updateLatestEventRemark,
} from '@/app/applications/actions'
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
  const [isStatusPending, setIsStatusPending] = useState(false)
  const [isRemarkPending, setIsRemarkPending] = useState(false)
  const [isDeletePending, setIsDeletePending] = useState(false)
  const [statusError, setStatusError] = useState('')
  const [remarkError, setRemarkError] = useState('')
  const [deleteError, setDeleteError] = useState('')

  function handleMenuToggle() {
    if (menuOpen) {
      setMenuOpen(false)
      return
    }

    if (triggerRef.current) {
      setMenuSide(
        getStatusMenuSide(
          triggerRef.current.getBoundingClientRect(),
          window.innerHeight,
        ),
      )
    }

    setMenuOpen(true)
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
      return
    }

    setCurrentStatus(nextStatus)
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
      return
    }

    startTransition(() => {
      router.refresh()
    })
  }

  async function handleDelete() {
    if (!window.confirm('删除后无法恢复，确认继续吗？')) {
      return
    }

    setDeleteError('')
    setIsDeletePending(true)

    const result = await deleteApplication(app.id)

    setIsDeletePending(false)

    if (result.error) {
      setDeleteError(result.error)
      return
    }

    router.push('/applications')
  }

  return (
    <section className="rounded-[1.75rem] border border-slate-200/70 bg-[var(--card)] p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">详情操作</h2>
          <p className="mt-1 text-sm text-slate-500">
            维护当前阶段、最新进展备注和删除操作。
          </p>
        </div>
        <StatusBadge status={currentStatus} />
      </div>

      <div className="mt-5">
        <div className="relative inline-block">
          <button
            ref={triggerRef}
            type="button"
            disabled={isStatusPending}
            onClick={handleMenuToggle}
            className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isStatusPending ? '更新中...' : '更新状态'}
          </button>
          {menuOpen ? (
            <div
              role="menu"
              data-side={menuSide}
              className={`absolute left-0 z-10 min-w-40 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg ${
                menuSide === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
              }`}
            >
              {ALL_STATUSES.map((status) => {
                const isCurrent = status === currentStatus

                return (
                  <button
                    key={status}
                    type="button"
                    disabled={isCurrent || isStatusPending}
                    onClick={() => handleStatusChange(status)}
                    className="block w-full rounded-xl px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    {isCurrent
                      ? `${STATUS_LABEL[status]}（当前）`
                      : STATUS_LABEL[status]}
                  </button>
                )
              })}
            </div>
          ) : null}
        </div>
        {statusError ? (
          <p className="mt-3 text-sm text-red-600">{statusError}</p>
        ) : null}
      </div>

      <div className="mt-8">
        <label
          htmlFor="latest-remark"
          className="text-sm font-medium text-slate-800"
        >
          最新进展备注
        </label>
        <textarea
          id="latest-remark"
          value={remark}
          rows={4}
          onChange={(event) => setRemark(event.target.value)}
          className="mt-2 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400"
        />
        {remarkError ? (
          <p className="mt-2 text-sm text-red-600">{remarkError}</p>
        ) : null}
        <button
          type="button"
          disabled={isRemarkPending}
          onClick={handleRemarkSubmit}
          className="mt-4 rounded-full bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isRemarkPending ? '保存中...' : '保存备注'}
        </button>
      </div>

      <div className="mt-8 border-t border-slate-200 pt-6">
        <button
          type="button"
          disabled={isDeletePending}
          onClick={handleDelete}
          className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isDeletePending ? '删除中...' : '删除这条投递'}
        </button>
        {deleteError ? (
          <p className="mt-3 text-sm text-red-600">{deleteError}</p>
        ) : null}
      </div>
    </section>
  )
}
