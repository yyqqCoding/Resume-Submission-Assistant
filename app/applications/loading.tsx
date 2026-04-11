export default function ApplicationsLoading() {
  return (
    <main className="min-h-screen px-4 py-10">
      <section
        data-testid="applications-loading"
        className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-slate-200/70 bg-white/80 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur"
      >
        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.15fr_0.85fr] lg:p-10">
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-sm uppercase tracking-[0.28em] text-slate-400">
                Step 3
              </p>
              <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
                正在加载投递列表
              </h1>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="h-28 animate-pulse rounded-[1.5rem] bg-slate-100" />
              <div className="h-28 animate-pulse rounded-[1.5rem] bg-slate-100" />
              <div className="h-28 animate-pulse rounded-[1.5rem] bg-slate-100" />
            </div>

            <div className="space-y-4">
              <div className="h-40 animate-pulse rounded-[1.75rem] bg-slate-100" />
              <div className="h-40 animate-pulse rounded-[1.75rem] bg-slate-100" />
            </div>
          </div>

          <aside className="rounded-[1.75rem] border border-slate-200 bg-[linear-gradient(180deg,#fff,#f8fafc)] p-6">
            <div className="space-y-4">
              <div className="h-24 animate-pulse rounded-3xl bg-slate-100" />
              <div className="h-32 animate-pulse rounded-3xl bg-slate-100" />
              <div className="h-44 animate-pulse rounded-3xl bg-slate-100" />
            </div>
          </aside>
        </div>
      </section>
    </main>
  )
}
