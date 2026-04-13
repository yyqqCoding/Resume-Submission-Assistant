import Link from 'next/link'
import { CirclePlus } from 'lucide-react'
import { redirect } from 'next/navigation'
import ApplicationsClient from '@/components/ApplicationsClient'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { ALL_STATUSES, type Application, type ApplicationStatusFilter } from '@/types'
import SignOutButton from './sign-out-button'

const PAGE_SIZE = 10

type SearchParams = {
  status?: string | string[]
  page?: string | string[]
}

function getSingleValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function normalizeFilter(value: string | string[] | undefined): ApplicationStatusFilter {
  const nextValue = getSingleValue(value)

  if (nextValue && (ALL_STATUSES as readonly string[]).includes(nextValue)) {
    return nextValue as ApplicationStatusFilter
  }

  return 'all'
}

function normalizePage(value: string | string[] | undefined) {
  const nextValue = Number.parseInt(getSingleValue(value) ?? '1', 10)

  if (!Number.isFinite(nextValue) || nextValue < 1) {
    return 1
  }

  return nextValue
}

function getPageRange(page: number) {
  const from = (page - 1) * PAGE_SIZE

  return {
    from,
    to: from + PAGE_SIZE - 1,
  }
}

function getTotalPages(totalCount: number) {
  return totalCount > 0 ? Math.ceil(totalCount / PAGE_SIZE) : 0
}

function clampPage(page: number, totalPages: number) {
  if (totalPages === 0) {
    return 1
  }

  return Math.min(page, totalPages)
}

function getMatchFilter(userId: string, currentFilter: ApplicationStatusFilter) {
  if (currentFilter === 'all') {
    return { user_id: userId }
  }

  return {
    user_id: userId,
    status: currentFilter,
  }
}

type Props = {
  searchParams?: Promise<SearchParams>
}

export default async function ApplicationsPage({ searchParams }: Props) {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  const resolvedSearchParams = searchParams ? await searchParams : {}
  const currentFilter = normalizeFilter(resolvedSearchParams.status)
  const requestedPage = normalizePage(resolvedSearchParams.page)
  const matchFilter = getMatchFilter(user.id, currentFilter)
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

  const statsPromises = Promise.all([
    supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .match({ user_id: user.id }),
    supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .match({ user_id: user.id, status: 'offer' }),
    supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .match({ user_id: user.id, status: 'rejected' }),
  ])

  const [
    { count: rawFilteredTotalCount, error: filteredCountError },
    initialListResult,
    [
      { count: totalApplications, error: totalStatsError },
      { count: offerApplications, error: offerStatsError },
      { count: rejectedApplications, error: rejectedStatsError },
    ],
  ] = await Promise.all([
    filteredCountPromise,
    initialListPromise,
    statsPromises,
  ])

  const filteredTotalCount = filteredCountError ? 0 : rawFilteredTotalCount ?? 0
  const totalPages = getTotalPages(filteredTotalCount)
  const currentPage = clampPage(requestedPage, totalPages)

  let applications: Application[] = []
  let listError = filteredCountError ? '投递列表加载失败，请稍后再试。' : ''

  if (!listError && filteredTotalCount > 0) {
    let listResult = initialListResult

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

    if (listQueryError) {
      listError = '投递列表加载失败，请稍后再试。'
    } else {
      applications = (data ?? []) as Application[]
    }
  }

  const statsError =
    totalStatsError || offerStatsError || rejectedStatsError
      ? '统计加载失败，请稍后再试。'
      : ''

  const summary = statsError
    ? {
        totalApplications: null,
        offerApplications: null,
        rejectedApplications: null,
      }
    : {
        totalApplications: totalApplications ?? 0,
        offerApplications: offerApplications ?? 0,
        rejectedApplications: rejectedApplications ?? 0,
      }

  return (
    <main className="min-h-screen px-4 py-10">
      <section className="mx-auto max-w-6xl overflow-visible rounded-[2rem] border border-slate-200/70 bg-white/80 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur">
        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.15fr_0.85fr] lg:p-10">
          <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-3">
                <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
                  投递总览
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                  集中查看当前投递、阶段变化和待跟进机会，把节奏和优先级掌握在自己手里。
                </p>
              </div>

              <Button
                asChild
                size="lg"
                className="rounded-2xl px-5 shadow-[0_18px_45px_rgba(20,83,45,0.2)]"
              >
                <Link href="/applications/new">
                  <CirclePlus className="size-4" />
                  新增投递
                </Link>
              </Button>
            </div>

            <ApplicationsClient
              applications={applications}
              currentFilter={currentFilter}
              currentPage={currentPage}
              totalPages={totalPages}
              filteredTotalCount={filteredTotalCount}
              summary={summary}
              listError={listError}
              statsError={statsError}
            />
          </div>

          <aside className="rounded-[1.75rem] border border-slate-200 bg-[linear-gradient(180deg,#fff,#f8fafc)] p-6">
            <div className="space-y-4">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-400">
                工作台
              </p>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-medium text-slate-900">当前账号</p>
                <p className="mt-3 break-all text-sm leading-6 text-slate-600">
                  {user.email ?? '未获取到邮箱'}
                </p>
              </div>

              <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
                <p className="text-sm font-medium text-emerald-900">跟进建议</p>
                <p className="mt-3 text-sm leading-6 text-emerald-800">
                  收到新进展后及时更新状态和备注，后续回看会更清晰。
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <p className="text-sm font-medium text-slate-900">今日节奏</p>
                <ul className="mt-3 space-y-3 text-sm leading-6 text-slate-600">
                  <li>1. 先筛选需要优先跟进的记录</li>
                  <li>2. 在详情页补充最新反馈与备注</li>
                  <li>3. 新机会随时补录，保持记录完整</li>
                </ul>
              </div>

              <SignOutButton />
            </div>
          </aside>
        </div>
      </section>
    </main>
  )
}
