import { FileText, CalendarCheck, BellRing, BarChart3 } from 'lucide-react'

const features = [
  {
    icon: FileText,
    title: '投递记录，一目了然',
    desc: '集中管理所有投递记录，公司、岗位、来源、备注一站可查。',
    tone: 'bg-emerald-50 text-emerald-600',
  },
  {
    icon: CalendarCheck,
    title: '面试进度，清晰跟踪',
    desc: '记录每一轮面试节点与反馈，节奏与变化都不会再遗漏。',
    tone: 'bg-sky-50 text-sky-600',
  },
  {
    icon: BellRing,
    title: '智能提醒，及时跟进',
    desc: '关键节点自动提醒，待办与截止日期不再错过任何机会。',
    tone: 'bg-amber-50 text-amber-600',
  },
  {
    icon: BarChart3,
    title: '数据统计，助力决策',
    desc: '通过数据洞察转化率与周期，让求职策略更有依据。',
    tone: 'bg-purple-50 text-purple-600',
  },
]

export default function FeatureGrid() {
  return (
    <section id="features" className="border-t border-black/5 bg-white/60">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, desc, tone }) => (
            <div
              key={title}
              className="group rounded-2xl border border-black/5 bg-white/90 p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
            >
              <div
                className={
                  'mb-4 inline-flex size-11 items-center justify-center rounded-xl ' + tone
                }
              >
                <Icon className="size-5" strokeWidth={2} />
              </div>
              <h3 className="text-base font-bold text-foreground">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-foreground/60">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
