'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  buildApplicationsUrl,
  getApplicationsOverviewCacheKey,
  getTotalPages,
  type ApplicationsOverviewResponse,
} from '@/lib/applications-overview'
import { cn } from '@/lib/utils'
import type {
  Application,
  ApplicationStatus,
  ApplicationStatusFilter,
} from '@/types'
import ApplicationCard from './ApplicationCard'
import PaginationControls from './PaginationControls'
import StatusFilter from './StatusFilter'

type Props = {
  applications: Application[]
  currentFilter: ApplicationStatusFilter
  currentPage: number
  totalPages: number
  filteredTotalCount: number
  summary: {
    totalApplications: number | null
    offerApplications: number | null
    rejectedApplications: number | null
  }
  listError: string
  statsError: string
}

type HistoryMode = 'replace'

const STACK_TOP_OFFSET_REM = 1.05

function isInteractiveTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) {
    return false
  }

  return Boolean(
    target.closest(
      'button, a, input, textarea, select, label, [role="menuitem"], [data-slot="button"], [data-slot="dropdown-menu-trigger"], [data-slot="dropdown-menu-content"], [data-slot="input"], [data-slot="textarea"]',
    ),
  )
}

function renderSummaryValue(value: number | null) {
  return value ?? '--'
}

function createOverviewState({
  applications,
  currentFilter,
  currentPage,
  totalPages,
  filteredTotalCount,
  listError,
}: Pick<
  Props,
  | 'applications'
  | 'currentFilter'
  | 'currentPage'
  | 'totalPages'
  | 'filteredTotalCount'
  | 'listError'
>): ApplicationsOverviewResponse {
  return {
    applications,
    currentFilter,
    currentPage,
    totalPages,
    filteredTotalCount,
    listError,
  }
}

function syncApplicationsUrl(
  nextFilter: ApplicationStatusFilter,
  nextPage: number,
  mode: HistoryMode,
) {
  const nextUrl = buildApplicationsUrl(
    window.location.pathname,
    window.location.search.slice(1),
    {
      status: nextFilter,
      page: nextPage,
    },
  )

  if (mode === 'replace') {
    window.history.replaceState(window.history.state, '', nextUrl)
  }
}

function updateSummaryAfterStatusChange(
  summary: Props['summary'],
  previousStatus: ApplicationStatus,
  nextStatus: ApplicationStatus,
) {
  if (
    summary.totalApplications === null ||
    summary.offerApplications === null ||
    summary.rejectedApplications === null
  ) {
    return summary
  }

  return {
    totalApplications: summary.totalApplications,
    offerApplications:
      summary.offerApplications +
      (nextStatus === 'offer' ? 1 : 0) -
      (previousStatus === 'offer' ? 1 : 0),
    rejectedApplications:
      summary.rejectedApplications +
      (nextStatus === 'rejected' ? 1 : 0) -
      (previousStatus === 'rejected' ? 1 : 0),
  }
}

export default function ApplicationsClient({
  applications,
  currentFilter,
  currentPage,
  totalPages,
  filteredTotalCount,
  summary,
  listError,
  statsError,
}: Props) {
  const initialOverview = createOverviewState({
    applications,
    currentFilter,
    currentPage,
    totalPages,
    filteredTotalCount,
    listError,
  })
  const regionRef = useRef<HTMLDivElement | null>(null)
  const cacheRef = useRef(new Map<string, ApplicationsOverviewResponse>())
  const inFlightRef = useRef(
    new Map<string, Promise<ApplicationsOverviewResponse>>(),
  )
  const [overview, setOverview] =
    useState<ApplicationsOverviewResponse>(initialOverview)
  const overviewRef = useRef(overview)
  const [summaryState, setSummaryState] = useState(summary)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)
  const hasActiveCard = activeId !== null
  const showGlobalEmptyState =
    !overview.listError && summaryState.totalApplications === 0
  const showFilterEmptyState =
    !overview.listError &&
    summaryState.totalApplications !== 0 &&
    overview.applications.length === 0

  useEffect(() => {
    const nextOverview = createOverviewState({
      applications,
      currentFilter,
      currentPage,
      totalPages,
      filteredTotalCount,
      listError,
    })

    cacheRef.current.clear()
    inFlightRef.current.clear()
    cacheRef.current.set(
      getApplicationsOverviewCacheKey(
        nextOverview.currentFilter,
        nextOverview.currentPage,
      ),
      nextOverview,
    )
    setOverview(nextOverview)
    setSummaryState(summary)
    setActiveId(null)
  }, [
    applications,
    currentFilter,
    currentPage,
    totalPages,
    filteredTotalCount,
    listError,
    summary,
  ])

  useEffect(() => {
    overviewRef.current = overview
  }, [overview])

  useEffect(() => {
    if (!overview.applications.length) {
      setActiveId(null)
      return
    }

    if (activeId && !overview.applications.some((item) => item.id === activeId)) {
      setActiveId(null)
    }
  }, [activeId, overview.applications])

  useEffect(() => {
    if (!activeId) {
      return
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target

      if (!(target instanceof Node)) {
        return
      }

      if (regionRef.current?.contains(target)) {
        return
      }

      setActiveId(null)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [activeId])

  const requestOverview = useCallback(async (
    nextFilter: ApplicationStatusFilter,
    nextPage: number,
  ) => {
    const cacheKey = getApplicationsOverviewCacheKey(nextFilter, nextPage)
    const cached = cacheRef.current.get(cacheKey)

    if (cached) {
      return cached
    }

    const pendingRequest = inFlightRef.current.get(cacheKey)

    if (pendingRequest) {
      return pendingRequest
    }

    const request = fetch(
      buildApplicationsUrl('/api/applications/overview', '', {
        status: nextFilter,
        page: nextPage,
      }),
      {
        cache: 'no-store',
      },
    )
      .then(async (response) => {
        if (response.status === 401) {
          window.location.assign('/login')
          throw new Error('UNAUTHORIZED')
        }

        if (!response.ok) {
          throw new Error('FETCH_FAILED')
        }

        const nextOverview =
          (await response.json()) as ApplicationsOverviewResponse
        cacheRef.current.set(
          getApplicationsOverviewCacheKey(
            nextOverview.currentFilter,
            nextOverview.currentPage,
          ),
          nextOverview,
        )

        return nextOverview
      })
      .finally(() => {
        inFlightRef.current.delete(cacheKey)
      })

    inFlightRef.current.set(cacheKey, request)

    return request
  }, [])

  const prefetchOverview = useCallback((
    nextFilter: ApplicationStatusFilter,
    nextPage: number,
  ) => {
    if (nextPage < 1) {
      return
    }

    const cacheKey = getApplicationsOverviewCacheKey(nextFilter, nextPage)

    if (cacheRef.current.has(cacheKey)) {
      return
    }

    void requestOverview(nextFilter, nextPage).catch(() => {})
  }, [requestOverview])

  useEffect(() => {
    if (overview.totalPages <= 1) {
      return
    }

    if (overview.currentPage < overview.totalPages) {
      prefetchOverview(overview.currentFilter, overview.currentPage + 1)
    }

    if (overview.currentPage > 1) {
      prefetchOverview(overview.currentFilter, overview.currentPage - 1)
    }
  }, [
    overview.currentFilter,
    overview.currentPage,
    overview.totalPages,
    prefetchOverview,
  ])

  async function loadOverview(
    nextFilter: ApplicationStatusFilter,
    nextPage: number,
    options?: {
      silent?: boolean
      historyMode?: HistoryMode
    },
  ) {
    const { silent = false, historyMode = 'replace' } = options ?? {}

    if (!silent) {
      setIsPending(true)
    }

    try {
      const nextOverview = await requestOverview(nextFilter, nextPage)
      setOverview(nextOverview)
      setActiveId(null)
      syncApplicationsUrl(
        nextOverview.currentFilter,
        nextOverview.currentPage,
        historyMode,
      )
      regionRef.current?.scrollTo?.({ top: 0 })
    } catch (error) {
      if (!silent && (error as Error).message !== 'UNAUTHORIZED') {
        setOverview((current) => ({
          ...current,
          listError: '投递列表加载失败，请稍后再试。',
        }))
      }
    } finally {
      if (!silent) {
        setIsPending(false)
      }
    }
  }

  if (showGlobalEmptyState) {
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
      {statsError ? (
        <p className="rounded-[1.25rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {statsError}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">总投递</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {renderSummaryValue(summaryState.totalApplications)}
          </p>
          <p className="mt-1 text-sm text-slate-500">总投递</p>
        </div>

        <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-emerald-700/70">Offer</p>
          <p className="mt-2 text-3xl font-semibold text-emerald-800">
            {renderSummaryValue(summaryState.offerApplications)}
          </p>
          <p className="mt-1 text-sm text-emerald-700">Offer 数</p>
        </div>

        <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">已拒</p>
          <p className="mt-2 text-3xl font-semibold text-slate-700">
            {renderSummaryValue(summaryState.rejectedApplications)}
          </p>
          <p className="mt-1 text-sm text-slate-500">已拒数量</p>
        </div>
      </div>

      <StatusFilter
        current={overview.currentFilter}
        isPending={isPending}
        onFilterChangeAction={(nextFilter) => {
          void loadOverview(nextFilter, 1)
        }}
      />

      {overview.listError ? (
        <div className="rounded-[1.75rem] border border-red-200 bg-red-50 px-6 py-10 text-center">
          <p className="text-lg font-semibold text-red-700">{overview.listError}</p>
          <p className="mt-3 text-sm text-red-600">
            可以稍后刷新重试，或者先查看其他投递记录。
          </p>
        </div>
      ) : showFilterEmptyState ? (
        <div className="rounded-[1.75rem] border border-slate-200 bg-white px-6 py-10 text-center">
          <p className="text-lg font-semibold text-slate-900">当前筛选下暂无记录</p>
          <p className="mt-3 text-sm text-slate-500">
            切换筛选条件，或者先继续推进当前正在进行的投递。
          </p>
        </div>
      ) : (
        <div className="rounded-[1.75rem] border border-slate-200/70 bg-white/45 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] backdrop-blur-sm">
          <div
            role="region"
            aria-label="投递记录列表"
            ref={regionRef}
            className="scrollbar-hidden lg:max-h-[min(66vh,48rem)] lg:overflow-y-auto lg:overscroll-contain lg:p-1 lg:pr-0"
          >
            <div
              className="space-y-4 lg:space-y-0 lg:pb-6"
              onClick={(event) => {
                const target = event.target

                if (!(target instanceof Element)) {
                  return
                }

                if (!target.closest('[data-testid="stacked-card-shell"]')) {
                  setActiveId(null)
                }
              }}
            >
              {overview.applications.map((application, index) => (
                <div
                  key={application.id}
                  data-testid="stacked-card-shell"
                  data-stack-index={index}
                  data-stack-active={application.id === activeId}
                  onClick={(event) => {
                    if (isInteractiveTarget(event.target)) {
                      return
                    }

                    setActiveId((current) =>
                      current === application.id ? null : application.id,
                    )
                  }}
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
                        ? overview.applications.length + 20
                        : index + 1,
                  }}
                >
                  <ApplicationCard
                    app={application}
                    onStatusUpdatedAction={(nextStatus: ApplicationStatus) => {
                      let nextOverview = overviewRef.current

                      cacheRef.current.clear()
                      setOverview((current) => {
                        const nextApplications = current.applications
                          .map((item) =>
                            item.id === application.id
                              ? {
                                  ...item,
                                  status: nextStatus,
                                }
                              : item,
                          )
                          .filter(
                            (item) =>
                              current.currentFilter === 'all' ||
                              item.status === current.currentFilter,
                          )

                        const nextFilteredTotalCount =
                          current.currentFilter === 'all' ||
                          application.status === nextStatus
                            ? current.filteredTotalCount
                            : Math.max(current.filteredTotalCount - 1, 0)

                        nextOverview = {
                          ...current,
                          applications: nextApplications,
                          filteredTotalCount: nextFilteredTotalCount,
                          totalPages: getTotalPages(nextFilteredTotalCount),
                        }

                        return nextOverview
                      })
                      setSummaryState((current) =>
                        updateSummaryAfterStatusChange(
                          current,
                          application.status,
                          nextStatus,
                        ),
                      )
                      setActiveId(null)
                      void loadOverview(
                        nextOverview.currentFilter,
                        nextOverview.currentPage,
                        {
                          silent: true,
                        },
                      )
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          <PaginationControls
            currentPage={overview.currentPage}
            totalPages={overview.totalPages}
            totalCount={overview.filteredTotalCount}
            isPending={isPending}
            onPageChangeAction={(nextPage) => {
              void loadOverview(overview.currentFilter, nextPage)
            }}
          />
        </div>
      )}
    </div>
  )
}
