'use client'

import { Button } from '@/components/ui/button'

type Props = {
  currentPage: number
  totalPages: number
  totalCount: number
  isPending: boolean
  onPageChangeAction: (nextPage: number) => void
}

export default function PaginationControls({
  currentPage,
  totalPages,
  totalCount,
  isPending,
  onPageChangeAction,
}: Props) {
  if (totalPages <= 1) {
    return null
  }

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1)

  return (
    <div
      aria-busy={isPending}
      className={`flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 px-2 pt-4 transition-opacity ${
        isPending ? 'opacity-70' : ''
      }`}
    >
      <p className="text-sm text-slate-500">
        第 {currentPage} / {totalPages} 页，共 {totalCount} 条
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isPending || currentPage === 1}
          onClick={() => onPageChangeAction(currentPage - 1)}
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
              disabled={isPending}
              onClick={() => onPageChangeAction(page)}
            >
              {page}
            </Button>
          )
        })}

        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isPending || currentPage === totalPages}
          onClick={() => onPageChangeAction(currentPage + 1)}
        >
          下一页
        </Button>
      </div>
    </div>
  )
}
