import Link from 'next/link'
import { PlayCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import DashboardMock from './DashboardMock'

export default function LandingHero() {
  return (
    <section id="overview" className="relative overflow-hidden">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 lg:grid-cols-[1.05fr_1fr] lg:gap-10 lg:py-24">
        <div className="flex flex-col justify-center">
          <span className="inline-flex w-fit items-center rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-medium text-[var(--accent)]">
            让每次求职更高效，让每次投递都不再迷茫
          </span>

          <h1 className="mt-6 text-4xl font-extrabold leading-[1.18] tracking-tight text-foreground sm:text-5xl">
            高效管理求职申请，
            <br />
            让每一次投递都有回响
          </h1>

          <p className="mt-5 max-w-lg text-base leading-7 text-foreground/65">
            记录每一次投递进展，跟踪面试节点，设置智能提醒与待办，用数据洞察助你优化，掌握求职全流程。
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="rounded-full px-6 shadow-md shadow-[var(--accent)]/20">
              <Link href="/login">免费注册，开启高效求职</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full px-5">
              <Link href="#features">
                <PlayCircle className="size-4" />
                观看产品演示
              </Link>
            </Button>
          </div>
        </div>

        <div className="relative lg:pl-4">
          <div
            className="absolute -inset-6 -z-10 rounded-[2rem] opacity-60 blur-3xl"
            style={{
              background:
                'radial-gradient(circle at 60% 40%, rgba(20,83,45,0.18), transparent 60%)',
            }}
          />
          <DashboardMock />
        </div>
      </div>
    </section>
  )
}
