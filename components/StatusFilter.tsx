'use client'

import { useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { buildApplicationsUrl } from '@/lib/applications-overview'
import {
  ALL_STATUSES,
  STATUS_LABEL,
  type ApplicationStatusFilter,
} from '@/types'

type Props = {
  current: ApplicationStatusFilter
}

const FILTER_OPTIONS: ApplicationStatusFilter[] = ['all', ...ALL_STATUSES]

function getFilterLabel(value: ApplicationStatusFilter) {
  return value === 'all' ? '全部' : STATUS_LABEL[value]
}

export default function StatusFilter({ current }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, pendingTransition] = useTransition()

  return (
    <fieldset
      aria-busy={isPending}
      className={`flex flex-wrap gap-2 transition-opacity ${
        isPending ? 'opacity-70' : ''
      }`}
    >
      <legend className="mb-2 w-full text-sm font-medium text-slate-700">
        状态筛选
      </legend>
      {FILTER_OPTIONS.map((value) => {
        const isActive = current === value

        return (
          <button
            key={value}
            type="button"
            aria-pressed={isActive}
            disabled={isPending}
            onClick={() => {
              if (!isActive) {
                pendingTransition(() => {
                  router.push(
                    buildApplicationsUrl(pathname, searchParams.toString(), {
                      status: value,
                      page: 1,
                    }),
                  )
                })
              }
            }}
            className={`rounded-full border px-3 py-2 text-xs font-medium transition ${
              isActive
                ? 'border-emerald-700 bg-emerald-700 text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:text-emerald-700'
            }`}
          >
            {getFilterLabel(value)}
          </button>
        )
      })}
    </fieldset>
  )
}
