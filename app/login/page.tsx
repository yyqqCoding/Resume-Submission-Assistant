import { getSiteUrl } from '@/lib/env'
import LoginForm from './LoginForm'

export default function LoginPage() {
  const siteUrl = getSiteUrl()

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/60 bg-[rgba(255,255,255,0.5)] shadow-[0_30px_120px_rgba(15,23,42,0.08)] backdrop-blur">
        <div className="grid min-h-[42rem] lg:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col justify-between bg-[linear-gradient(180deg,rgba(20,83,45,0.94),rgba(6,78,59,0.94))] p-8 text-white sm:p-10">
            <div className="space-y-5">
              <div className="space-y-4">
                <h1 className="max-w-md text-4xl font-semibold leading-tight sm:text-5xl">
                  简历投递追踪器
                </h1>
                <p className="max-w-md text-sm leading-7 text-emerald-50/80 sm:text-base">
                  集中记录每一次投递、面试进展和跟进动作，让机会、节奏与反馈都更清晰。
                </p>
              </div>
            </div>

            <div className="grid gap-3 text-sm text-emerald-50/85 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-white/10 p-4">
                <p className="font-medium">投递记录</p>
                <p className="mt-2 text-xs leading-6 text-emerald-50/70">
                  统一维护公司、岗位、来源链接与备注信息。
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/10 p-4">
                <p className="font-medium">进展跟进</p>
                <p className="mt-2 text-xs leading-6 text-emerald-50/70">
                  随时更新阶段变化，补充最新反馈与后续动作。
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center p-6 sm:p-10">
            <div className="w-full max-w-md rounded-[1.75rem] border border-slate-200/70 bg-[var(--card)] p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-8">
              <div className="mb-6 space-y-2">
                <p className="text-sm font-medium uppercase tracking-[0.22em] text-slate-400">
                  欢迎回来
                </p>
                <h2 className="text-3xl font-semibold text-slate-900">
                  登录或创建账号
                </h2>
                <p className="text-sm leading-6 text-slate-500">
                  使用邮箱登录，或先注册新账号开始管理你的投递记录。
                </p>
              </div>
              <LoginForm siteUrl={siteUrl} />
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
