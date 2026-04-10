import Link from 'next/link'
import { redirect } from 'next/navigation'
import ApplicationsClient from '@/components/ApplicationsClient'
import { createClient } from '@/lib/supabase/server'
import type { Application } from '@/types'
import SignOutButton from './sign-out-button'

export default async function ApplicationsPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  const { data } = await supabase
    .from('applications')
    .select('*')
    .eq('user_id', user.id)
    .order('applied_at', { ascending: false })
    .order('created_at', { ascending: false })

  const applications = (data ?? []) as Application[]

  return (
    <main className="min-h-screen px-4 py-10">
      <section className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-slate-200/70 bg-white/80 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur">
        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.15fr_0.85fr] lg:p-10">
          <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-3">
                <p className="text-sm uppercase tracking-[0.28em] text-slate-400">
                  Step 3
                </p>
                <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
                  投递列表与状态流转
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                  首屏列表由服务端读取，状态筛选和卡片菜单由客户端处理，时间线事件仍由
                  Supabase trigger 自动维护。
                </p>
              </div>

              <Link
                href="/applications/new"
                className="inline-flex items-center rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600"
              >
                + 新增
              </Link>
            </div>

            <ApplicationsClient applications={applications} />
          </div>

          <aside className="rounded-[1.75rem] border border-slate-200 bg-[linear-gradient(180deg,#fff,#f8fafc)] p-6">
            <div className="space-y-4">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-400">
                Session
              </p>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-medium text-slate-900">当前账号</p>
                <p className="mt-3 break-all text-sm leading-6 text-slate-600">
                  {user.email ?? '未获取到邮箱'}
                </p>
              </div>

              <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
                <p className="text-sm font-medium text-emerald-900">当前阶段</p>
                <p className="mt-3 text-sm leading-6 text-emerald-800">
                  列表页已接入，状态变化会自动沉淀到 application_events 时间线。
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <p className="text-sm font-medium text-slate-900">数据库约束</p>
                <ul className="mt-3 space-y-3 text-sm leading-6 text-slate-600">
                  <li>1. `updated_at` 由 trigger 自动更新</li>
                  <li>2. 新增投递自动写入初始事件</li>
                  <li>3. 状态变化自动追加时间线事件</li>
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
