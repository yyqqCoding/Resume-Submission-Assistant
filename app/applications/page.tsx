import Link from 'next/link'
import { CirclePlus } from 'lucide-react'
import { redirect } from 'next/navigation'
import ApplicationsClient from '@/components/ApplicationsClient'
import { Button } from '@/components/ui/button'
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

            <ApplicationsClient applications={applications} />
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
