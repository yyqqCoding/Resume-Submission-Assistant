import Link from 'next/link'
import { createApplication } from '@/app/applications/actions'
import NewApplicationForm from './NewApplicationForm'

export default function NewApplicationPage() {
  return (
    <main className="min-h-screen px-4 py-10">
      <section className="mx-auto max-w-3xl overflow-hidden rounded-[2rem] border border-slate-200/70 bg-white/80 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur">
        <div className="space-y-8 p-6 sm:p-8">
          <div className="space-y-4">
            <Link
              href="/applications"
              className="inline-flex items-center text-sm font-medium text-slate-500 transition hover:text-slate-700"
            >
              ← 返回投递列表
            </Link>

            <div className="space-y-3">
              <p className="text-sm uppercase tracking-[0.28em] text-slate-400">
                Step 2
              </p>
              <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
                新增投递记录
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                粘贴招聘链接后会先在本地解析公司名，再写入投递主表。初始时间线事件由
                Supabase trigger 自动创建。
              </p>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200/70 bg-[var(--card)] p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-8">
            <NewApplicationForm submitAction={createApplication} />
          </div>
        </div>
      </section>
    </main>
  )
}
