'use client'

import Link from 'next/link'
import { useRef, useState } from 'react'
import { updateApplicationStatus } from '@/app/applications/actions'
import { getStatusMenuSide } from '@/lib/status-menu-side'
import { ALL_STATUSES, STATUS_LABEL, type Application } from '@/types'
import StatusBadge from './StatusBadge'

type Props = {
  app: Application
  onStatusUpdated: () => void | Promise<void>
}

function formatAppliedAt(value: string) {
  const parts = value.split('-')

  if (parts.length !== 3) {
    return value
  }

  return `${Number(parts[1])}月${Number(parts[2])}日`
}

export default function ApplicationCard({ app, onStatusUpdated }: Props) {
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuSide, setMenuSide] = useState<'top' | 'bottom'>('bottom')
  const [isUpdating, setIsUpdating] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

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

  async function handleStatusChange(nextStatus: string) {
    if (nextStatus === app.status) {
      setMenuOpen(false)
      return
    }

    setIsUpdating(true)
    setErrorMessage('')
    setMenuOpen(false)

    const result = await updateApplicationStatus(app.id, nextStatus)

    if (result.error) {
      setErrorMessage(result.error)
      setIsUpdating(false)
      return
    }

    setIsUpdating(false)
    await onStatusUpdated()
  }

  return (
    <article className="rounded-[1.75rem] border border-slate-200/70 bg-[var(--card)] p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-slate-900">
            {app.company_name ?? '未命名公司'}
          </h3>
          <p className="text-sm text-slate-600">
            {app.job_title ?? '未填写岗位'}
          </p>
        </div>
        <StatusBadge status={app.status} />
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
        <span>{formatAppliedAt(app.applied_at)} 投递</span>
        {app.note ? <span>备注：{app.note}</span> : null}
      </div>

      {errorMessage ? (
        <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {errorMessage}
        </p>
      ) : null}

      <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4">
        <div className="relative">
          <button
            ref={triggerRef}
            type="button"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            disabled={isUpdating}
            onClick={handleMenuToggle}
            className="text-sm font-medium text-emerald-800 transition hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isUpdating ? '更新中...' : '更新状态'}
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
                const isCurrent = status === app.status

                return (
                  <button
                    key={status}
                    type="button"
                    disabled={isUpdating || isCurrent}
                    onClick={() => handleStatusChange(status)}
                    className={`block w-full rounded-xl px-3 py-2 text-left text-sm transition ${
                      isCurrent
                        ? 'cursor-not-allowed bg-slate-100 text-slate-400'
                        : 'text-slate-700 hover:bg-emerald-50 hover:text-emerald-800'
                    }`}
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

        <Link
          href={`/applications/${app.id}`}
          className="text-xs font-medium text-slate-500 transition hover:text-emerald-700"
        >
          查看详情
        </Link>
      </div>
    </article>
  )
}
