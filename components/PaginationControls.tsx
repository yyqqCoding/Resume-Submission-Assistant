'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { buildApplicationsUrl } from '@/lib/applications-overview'
import type { ApplicationStatusFilter } from '@/types'
import { Button } from '@/components/ui/button'

type Props = {
  currentPage: number
  totalPages: number
  totalCount: number
}

export default function PaginationControls({
  currentPage,
  totalPages,
  totalCount,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentStatus = (searchParams.get('status') ??
    'all') as ApplicationStatusFilter

  if (totalPages <= 1) {
    return null
  }

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1)

  function pushPage(nextPage: number) {
    router.push(
      buildApplicationsUrl(pathname, searchParams.toString(), {
        status: currentStatus,
        page: nextPage,
      }),
    )
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 px-2 pt-4">
      <p className="text-sm text-slate-500">
        第 {currentPage} / {totalPages} 页，共 {totalCount} 条
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={currentPage === 1}
          onClick={() => pushPage(currentPage - 1)}
        >
          上一页
        </Button>

        {pages.map((page) => {
          const isCurrent = page === currentPage

          return (
            <Button
              key={page}
              type="button"
              size="sm"
              variant={isCurrent ? 'default' : 'outline'}
              aria-current={isCurrent ? 'page' : undefined}
              onClick={() => pushPage(page)}
            >
              {page}
            </Button>
          )
        })}

        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={currentPage === totalPages}
          onClick={() => pushPage(currentPage + 1)}
        >
          下一页
        </Button>
      </div>
    </div>
  )
}
