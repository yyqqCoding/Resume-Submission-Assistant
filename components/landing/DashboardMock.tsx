import {
  LayoutDashboard,
  FileText,
  Building2,
  CalendarDays,
  FolderOpen,
  BarChart3,
  Settings,
  CheckSquare,
  Sparkles,
  Bell,
} from 'lucide-react'

const sidebarItems = [
  { icon: LayoutDashboard, label: '概览', active: true },
  { icon: FileText, label: '投递记录' },
  { icon: Building2, label: '公司库' },
  { icon: CalendarDays, label: '面试日历' },
  { icon: FolderOpen, label: '简历库' },
  { icon: BarChart3, label: '数据洞察' },
  { icon: Settings, label: '设置' },
]

const stats = [
  { label: '投递中', value: 24, tone: 'bg-blue-50 text-blue-600' },
  { label: '面试中', value: 6, tone: 'bg-amber-50 text-amber-600' },
  { label: 'Offer', value: 2, tone: 'bg-emerald-50 text-emerald-600' },
  { label: '已结束', value: 3, tone: 'bg-rose-50 text-rose-600' },
]

const statusSegments = [
  { label: '投递中', value: 41.7, color: '#3b82f6' },
  { label: '面试中', value: 25, color: '#f59e0b' },
  { label: 'Offer', value: 16.7, color: '#10b981' },
  { label: '已结束', value: 16.6, color: '#ef4444' },
]

const recentRecords = [
  { name: '字节跳动', role: '前端工程师', when: '今天' },
  { name: '腾讯', role: '后端开发', when: '昨天' },
  { name: '阿里巴巴', role: '产品经理', when: '2 天前' },
]

const recentApplications = [
  { company: '美团', role: '高级前端', status: '一面通过', tone: 'text-amber-600' },
  { company: '京东', role: '全栈工程师', status: '已投递', tone: 'text-blue-600' },
  { company: '小米', role: '算法工程师', status: 'Offer', tone: 'text-emerald-600' },
]

const todos = [
  { title: '准备美团二面', due: '明天 14:00' },
  { title: '提交京东简历', due: '本周内' },
  { title: '回复 HR 邮件', due: '今天' },
]

function DonutChart() {
  const gradient = (() => {
    let acc = 0
    const parts = statusSegments.map((s) => {
      const start = acc
      acc += s.value
      return `${s.color} ${start}% ${acc}%`
    })
    return `conic-gradient(${parts.join(', ')})`
  })()

  return (
    <div className="flex items-center gap-4">
      <div
        className="relative flex size-28 items-center justify-center rounded-full"
        style={{ background: gradient }}
      >
        <div className="flex size-20 flex-col items-center justify-center rounded-full bg-white">
          <span className="text-2xl font-bold text-foreground">24</span>
          <span className="text-[10px] text-muted-foreground">总申请</span>
        </div>
      </div>
      <ul className="space-y-1.5 text-[11px]">
        {statusSegments.map((s) => (
          <li key={s.label} className="flex items-center gap-2">
            <span className="size-2 rounded-full" style={{ background: s.color }} />
            <span className="text-foreground/70">{s.label}</span>
            <span className="ml-auto font-medium text-foreground">{s.value}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function DashboardMock() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-black/5 bg-white shadow-[0_30px_60px_-20px_rgba(20,83,45,0.25)]">
      <div className="grid grid-cols-[150px_1fr] text-[11px]">
        {/* Sidebar */}
        <aside className="flex flex-col gap-1 border-r border-black/5 bg-[#fafbf9] p-3">
          <div className="mb-2 flex items-center gap-1.5 px-1.5">
            <span className="flex size-5 items-center justify-center rounded bg-[var(--accent)] text-white">
              <CheckSquare className="size-3" strokeWidth={3} />
            </span>
            <span className="text-xs font-bold">职途清单</span>
          </div>
          {sidebarItems.map(({ icon: Icon, label, active }) => (
            <div
              key={label}
              className={
                'flex items-center gap-2 rounded-md px-2 py-1.5 ' +
                (active
                  ? 'bg-[var(--accent-soft)] text-[var(--accent)] font-medium'
                  : 'text-foreground/60')
              }
            >
              <Icon className="size-3.5" />
              <span>{label}</span>
            </div>
          ))}
          <div className="mt-auto rounded-lg border border-[var(--accent)]/20 bg-[var(--accent-soft)]/50 p-2.5">
            <div className="flex items-center gap-1 text-[var(--accent)]">
              <Sparkles className="size-3" />
              <span className="text-[10px] font-semibold">升级到 Pro</span>
            </div>
            <p className="mt-1 text-[9px] text-foreground/60">解锁高级洞察</p>
            <button className="mt-2 w-full rounded bg-[var(--accent)] py-1 text-[9px] font-medium text-white">
              立即升级
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="space-y-3 bg-[#fdfdfb] p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold">概览</span>
            <div className="flex items-center gap-1.5">
              <Bell className="size-3.5 text-foreground/50" />
              <span className="flex size-6 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[10px] font-semibold text-[var(--accent)]">
                张
              </span>
              <span className="text-[10px] text-foreground/70">张同学</span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-2">
            {stats.map((s) => (
              <div key={s.label} className="rounded-lg border border-black/5 bg-white p-2">
                <div className={'mb-1 inline-flex size-5 items-center justify-center rounded ' + s.tone}>
                  <span className="size-1.5 rounded-full bg-current" />
                </div>
                <div className="text-base font-bold leading-none">{s.value}</div>
                <div className="mt-0.5 text-[9px] text-foreground/60">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Donut + Recent records */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-black/5 bg-white p-3">
              <div className="mb-2 text-[10px] font-semibold text-foreground/70">申请状态分布</div>
              <DonutChart />
            </div>
            <div className="rounded-lg border border-black/5 bg-white p-3">
              <div className="mb-2 text-[10px] font-semibold text-foreground/70">近期记录</div>
              <ul className="space-y-1.5">
                {recentRecords.map((r) => (
                  <li key={r.name} className="flex items-center gap-2">
                    <span className="flex size-5 items-center justify-center rounded bg-[var(--accent-soft)] text-[8px] font-bold text-[var(--accent)]">
                      {r.name.charAt(0)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-[10px] font-medium">{r.name}</div>
                      <div className="truncate text-[9px] text-foreground/50">{r.role}</div>
                    </div>
                    <span className="text-[9px] text-foreground/40">{r.when}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom: applications + todos */}
          <div className="grid grid-cols-[1.4fr_1fr] gap-2">
            <div className="rounded-lg border border-black/5 bg-white p-3">
              <div className="mb-2 text-[10px] font-semibold text-foreground/70">近期申请</div>
              <table className="w-full text-[9px]">
                <thead>
                  <tr className="text-foreground/40">
                    <th className="pb-1 text-left font-normal">公司</th>
                    <th className="pb-1 text-left font-normal">岗位</th>
                    <th className="pb-1 text-right font-normal">状态</th>
                  </tr>
                </thead>
                <tbody>
                  {recentApplications.map((a) => (
                    <tr key={a.company} className="border-t border-black/5">
                      <td className="py-1.5 font-medium">{a.company}</td>
                      <td className="py-1.5 text-foreground/60">{a.role}</td>
                      <td className={'py-1.5 text-right font-semibold ' + a.tone}>{a.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="rounded-lg border border-black/5 bg-white p-3">
              <div className="mb-2 text-[10px] font-semibold text-foreground/70">待办事项</div>
              <ul className="space-y-1.5">
                {todos.map((t) => (
                  <li key={t.title} className="flex items-start gap-2">
                    <span className="mt-0.5 size-2.5 shrink-0 rounded border border-[var(--accent)]/40" />
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-[9px] font-medium">{t.title}</div>
                      <div className="text-[8px] text-foreground/40">{t.due}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
