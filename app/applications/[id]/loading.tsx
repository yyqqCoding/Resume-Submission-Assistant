import { Skeleton } from '@/components/ui/skeleton'

export default function ApplicationDetailLoading() {
  return (
    <main className="min-h-screen bg-[var(--page-bg)] px-6 py-10 text-slate-900">
      <div
        data-testid="application-detail-loading"
        className="mx-auto max-w-5xl space-y-6"
      >
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-6 w-28 rounded-full" />
          <Skeleton className="h-8 w-20 rounded-full" />
        </div>

        <section className="rounded-[2rem] border border-slate-200/70 bg-[var(--card)] p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <p className="text-sm font-medium text-emerald-700">投递详情</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-950">
            正在加载投递详情
          </h1>
          <div className="mt-6 space-y-3">
            <Skeleton className="h-4 w-40 rounded-full" />
            <Skeleton className="h-4 w-72 rounded-full" />
          </div>
          <Skeleton className="mt-6 h-28 rounded-[1.5rem]" />
        </section>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Skeleton className="h-80 rounded-[1.75rem]" />
          <Skeleton className="h-80 rounded-[1.75rem]" />
        </div>
      </div>
    </main>
  )
}
