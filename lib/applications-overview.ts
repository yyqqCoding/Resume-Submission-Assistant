import type { ApplicationStatusFilter } from '@/types'

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
