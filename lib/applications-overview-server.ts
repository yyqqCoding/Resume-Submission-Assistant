import { type PostgrestError } from '@supabase/supabase-js'
import type { createClient } from '@/lib/supabase/server'
import {
  clampPage,
  getPageRange,
  getTotalPages,
  normalizeFilter,
  normalizePage,
  type ApplicationsOverviewResponse,
  type ApplicationsOverviewSearchParams,
} from '@/lib/applications-overview'
import { type Application, type ApplicationStatusFilter } from '@/types'

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

function getMatchFilter(
  userId: string,
  currentFilter: ApplicationStatusFilter,
) {
  if (currentFilter === 'all') {
    return { user_id: userId }
  }

  return {
    user_id: userId,
    status: currentFilter,
  }
}

function getListErrorMessage(error: PostgrestError | null) {
  return error ? '投递列表加载失败，请稍后再试。' : ''
}

export async function getApplicationsOverviewPage(
  supabase: SupabaseServerClient,
  userId: string,
  searchParams: ApplicationsOverviewSearchParams,
): Promise<ApplicationsOverviewResponse> {
  const currentFilter = normalizeFilter(searchParams.status)
  const requestedPage = normalizePage(searchParams.page)
  const matchFilter = getMatchFilter(userId, currentFilter)
  const initialRange = getPageRange(requestedPage)
  const filteredCountPromise = supabase
    .from('applications')
    .select('*', { count: 'exact', head: true })
    .match(matchFilter)

  const initialListPromise = supabase
    .from('applications')
    .select('*')
    .match(matchFilter)
    .order('applied_at', { ascending: false })
    .order('created_at', { ascending: false })
    .range(initialRange.from, initialRange.to)

  const { count: rawFilteredTotalCount, error: filteredCountError } =
    await filteredCountPromise

  if (filteredCountError) {
    return {
      applications: [],
      currentFilter,
      currentPage: 1,
      totalPages: 0,
      filteredTotalCount: 0,
      listError: getListErrorMessage(filteredCountError),
    }
  }

  const filteredTotalCount = rawFilteredTotalCount ?? 0
  const totalPages = getTotalPages(filteredTotalCount)
  const currentPage = clampPage(requestedPage, totalPages)

  if (filteredTotalCount === 0) {
    return {
      applications: [],
      currentFilter,
      currentPage,
      totalPages,
      filteredTotalCount,
      listError: '',
    }
  }

  let listResult = await initialListPromise

  if (currentPage !== requestedPage) {
    const { from, to } = getPageRange(currentPage)
    listResult = await supabase
      .from('applications')
      .select('*')
      .match(matchFilter)
      .order('applied_at', { ascending: false })
      .order('created_at', { ascending: false })
      .range(from, to)
  }

  const { data, error: listQueryError } = listResult

  return {
    applications: listQueryError ? [] : ((data ?? []) as Application[]),
    currentFilter,
    currentPage,
    totalPages,
    filteredTotalCount,
    listError: getListErrorMessage(listQueryError),
  }
}
