import {
  ALL_STATUSES,
  type Application,
  type ApplicationStatusFilter,
} from '@/types'

export const APPLICATIONS_PAGE_SIZE = 10

export type ApplicationsOverviewSearchParams = {
  status?: string | string[] | null
  page?: string | string[] | null
}

export type ApplicationsOverviewResponse = {
  applications: Application[]
  currentFilter: ApplicationStatusFilter
  currentPage: number
  totalPages: number
  filteredTotalCount: number
  listError: string
}

type ApplicationsRouteState = {
  status: ApplicationStatusFilter
  page: number
}

export function buildApplicationsUrl(
  pathname: string,
  search: string,
  nextState: ApplicationsRouteState,
) {
  const params = new URLSearchParams(search)

  if (nextState.status === 'all') {
    params.delete('status')
  } else {
    params.set('status', nextState.status)
  }

  if (nextState.page <= 1) {
    params.delete('page')
  } else {
    params.set('page', String(nextState.page))
  }

  const query = params.toString()

  return query ? `${pathname}?${query}` : pathname
}

export function getApplicationsOverviewCacheKey(
  filter: ApplicationStatusFilter,
  page: number,
) {
  return `${filter}:${page}`
}

export function getSingleValue(
  value: string | string[] | null | undefined,
) {
  return Array.isArray(value) ? value[0] : value
}

export function normalizeFilter(
  value: string | string[] | null | undefined,
): ApplicationStatusFilter {
  const nextValue = getSingleValue(value)

  if (nextValue && (ALL_STATUSES as readonly string[]).includes(nextValue)) {
    return nextValue as ApplicationStatusFilter
  }

  return 'all'
}

export function normalizePage(
  value: string | string[] | null | undefined,
) {
  const nextValue = Number.parseInt(getSingleValue(value) ?? '1', 10)

  if (!Number.isFinite(nextValue) || nextValue < 1) {
    return 1
  }

  return nextValue
}

export function getPageRange(page: number) {
  const from = (page - 1) * APPLICATIONS_PAGE_SIZE

  return {
    from,
    to: from + APPLICATIONS_PAGE_SIZE - 1,
  }
}

export function getTotalPages(totalCount: number) {
  return totalCount > 0 ? Math.ceil(totalCount / APPLICATIONS_PAGE_SIZE) : 0
}

export function clampPage(page: number, totalPages: number) {
  if (totalPages === 0) {
    return 1
  }

  return Math.min(page, totalPages)
}
