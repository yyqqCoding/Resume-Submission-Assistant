'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { updateApplicationStatus } from '@/app/applications/actions'
import { Button } from '@/components/ui/button'
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
  type ApplicationStatus,
} from '@/types'
import StatusBadge from './StatusBadge'

type Props = {
  app: Application
  onStatusUpdated: (nextStatus: ApplicationStatus) => void | Promise<void>
}

function formatAppliedAt(value: string) {
  const parts = value.split('-')

  if (parts.length !== 3) {
    return value
  }

  return `${Number(parts[1])}月${Number(parts[2])}日`
}

export default function ApplicationCard({ app, onStatusUpdated }: Props) {
  const router = useRouter()
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const prefetchedRef = useRef(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuSide, setMenuSide] = useState<'top' | 'bottom'>('bottom')
  const [isUpdating, setIsUpdating] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

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
      toast.error(result.error)
      return
    }

    setIsUpdating(false)
    await onStatusUpdated(nextStatus)
    toast.success(`状态已更新为${STATUS_LABEL[nextStatus]}`)
  }

  function prefetchDetail() {
    if (prefetchedRef.current) {
      return
    }

    prefetchedRef.current = true
    router.prefetch(`/applications/${app.id}`)
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
        <p
          role="alert"
          aria-live="assertive"
          className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600"
        >
          {errorMessage}
        </p>
      ) : null}

      <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4">
        <DropdownMenu open={menuOpen} onOpenChange={handleMenuChange}>
          <DropdownMenuTrigger asChild>
            <Button
              ref={triggerRef}
              type="button"
              variant="ghost"
              size="sm"
              disabled={isUpdating}
              className="h-auto rounded-none px-0 text-emerald-800 hover:bg-transparent hover:text-emerald-700"
            >
              {isUpdating ? '更新中...' : '更新状态'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side={menuSide} align="start">
            {ALL_STATUSES.map((status) => {
              const isCurrent = status === app.status

              return (
                <DropdownMenuItem
                  key={status}
                  disabled={isUpdating || isCurrent}
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

        <Link
          href={`/applications/${app.id}`}
          onMouseEnter={prefetchDetail}
          onFocus={prefetchDetail}
          className="text-xs font-medium text-slate-500 transition hover:text-emerald-700"
        >
          查看详情
        </Link>
      </div>
    </article>
  )
}
