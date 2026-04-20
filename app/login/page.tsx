import { getSiteUrl } from '@/lib/env'
import LoginForm from './LoginForm'
import MouseEffects from './MouseEffects'

export default function LoginPage() {
  const siteUrl = getSiteUrl()

  return (
    <>
      <MouseEffects />
      <main className="flex min-h-screen items-center justify-center px-4 py-10 bg-white text-black overflow-hidden perspective-[1000px]">
        <section className="w-full max-w-5xl rounded-[2.5rem] border-[3px] border-black bg-white shadow-[6px_6px_0_0_#000] animate-doodle-float relative z-10 transition-transform">
        <div className="grid min-h-[42rem] lg:grid-cols-[1.1fr_0.9fr] overflow-hidden rounded-[2.5rem]">
          <div className="flex flex-col justify-between bg-white border-b-[3px] lg:border-b-0 lg:border-r-[3px] border-black p-8 text-black sm:p-10 relative">
            <div className="space-y-5">
              <div className="space-y-4">
                <h1 className="max-w-md text-4xl font-black leading-tight tracking-tight sm:text-5xl">
                  简历投递追踪器
                </h1>
                <p className="max-w-md text-sm leading-7 text-black font-semibold sm:text-base">
                  集中记录每一次投递、面试进展和跟进动作，让机会、节奏与反馈都更清晰。
                </p>
              </div>
            </div>

            <div className="grid gap-5 text-sm text-black sm:grid-cols-2">
              <div className="rounded-[1.5rem] border-[3px] border-black bg-white p-5 shadow-[4px_4px_0_0_#000] -rotate-1 hover:rotate-0 hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#000] transition-all duration-300">
                <p className="font-black text-lg">投递记录</p>
                <p className="mt-2 text-xs leading-6 font-semibold">
                  统一维护公司、岗位、来源链接与备注信息。
                </p>
              </div>
              <div className="rounded-[1.5rem] border-[3px] border-black bg-white p-5 shadow-[4px_4px_0_0_#000] rotate-1 hover:rotate-0 hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#000] transition-all duration-300">
                <p className="font-black text-lg">进展跟进</p>
                <p className="mt-2 text-xs leading-6 font-semibold">
                  随时更新阶段变化，补充最新反馈与后续动作。
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center bg-white p-6 sm:p-10">
            <div className="w-full max-w-md rounded-[1.8rem] border-[3px] border-black bg-white p-6 shadow-[5px_5px_0_0_#000] hover:-translate-y-1 hover:shadow-[8px_8px_0_0_#000] transition-all duration-300 sm:p-8">
              <div className="mb-6 space-y-2">
                <p className="text-sm font-black uppercase tracking-[0.22em] text-black">
                  欢迎回来
                </p>
                <h2 className="text-3xl font-black text-black">
                  登录或创建账号
                </h2>
                <p className="text-sm leading-6 text-black font-semibold mt-2">
                  使用邮箱登录，或先注册新账号开始管理你的投递记录。
                </p>
              </div>
              <LoginForm siteUrl={siteUrl} />
            </div>
          </div>
        </div>
      </section>
    </main>
    </>
  )
}
