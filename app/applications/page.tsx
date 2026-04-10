import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
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

  return (
    <main className="min-h-screen px-4 py-10">
      <section className="mx-auto max-w-5xl overflow-hidden rounded-[2rem] border border-slate-200/70 bg-white/80 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur">
        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.2fr_0.8fr] lg:p-10">
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-3">
                  <p className="text-sm uppercase tracking-[0.28em] text-slate-400">
                    Protected Area
                  </p>
                  <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
                    登录成功，新增投递入口已接入
                  </h1>
                  <p className="max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                    第 2 步先把新增投递记录闭环跑通。列表展示和状态流转会在下一步补齐。
                  </p>
                </div>

                <Link
                  href="/applications/new"
                  className="inline-flex items-center rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600"
                >
                  + 新增
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-medium text-slate-900">当前账号</p>
                <p className="mt-3 break-all text-sm leading-6 text-slate-600">
                  {user.email ?? '未获取到邮箱'}
                </p>
              </div>
              <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
                <p className="text-sm font-medium text-emerald-900">当前状态</p>
                <p className="mt-3 text-sm leading-6 text-emerald-800">
                  会话可读取，受保护路由可访问，刷新后会话会继续保持。
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5">
              <p className="text-sm font-medium text-slate-900">下一步准备</p>
              <ul className="mt-3 space-y-3 text-sm leading-6 text-slate-600">
                <li>1. 新增投递记录表单</li>
                <li>2. 本地解析招聘链接中的公司名</li>
                <li>3. 写入 applications，时间线由数据库 trigger 自动补齐</li>
              </ul>
            </div>
          </div>

          <aside className="rounded-[1.75rem] border border-slate-200 bg-[linear-gradient(180deg,#fff,#f8fafc)] p-6">
            <div className="space-y-4">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-400">
                Session
              </p>
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-5">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                  User ID
                </p>
                <p className="mt-3 break-all text-sm leading-6 text-slate-700">
                  {user.id}
                </p>
              </div>
              <SignOutButton />
            </div>
          </aside>
        </div>
      </section>
    </main>
  )
}
