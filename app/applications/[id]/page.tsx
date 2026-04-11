import {
  getApplicationDetail,
  type ApplicationDetailResult,
} from '@/app/applications/actions'
import ApplicationDetailClient from '@/components/ApplicationDetailClient'
import BackToApplicationsButton from '@/components/BackToApplicationsButton'
import StatusBadge from '@/components/StatusBadge'
import Timeline from '@/components/Timeline'

type Props = {
  params: Promise<{ id: string }>
}

function formatAppliedAt(value: string) {
  const parts = value.split('-')

  if (parts.length !== 3) {
    return value
  }

  return `${parts[0]}年${Number(parts[1])}月${Number(parts[2])}日`
}

function renderEmptyState() {
  return (
    <main className="min-h-screen bg-[var(--page-bg)] px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-3xl rounded-[2rem] border border-slate-200/70 bg-[var(--card)] p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
        <p className="text-sm font-medium text-emerald-700">Application Detail</p>
        <h1 className="mt-3 text-2xl font-semibold">未找到这条投递记录</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          这条投递可能已被删除，或不属于当前登录用户。
        </p>
        <BackToApplicationsButton
          className="mt-6 inline-flex rounded-full bg-emerald-700 px-4 py-2 text-sm font-medium text-white"
        >
          返回列表
        </BackToApplicationsButton>
      </div>
    </main>
  )
}

export default async function ApplicationDetailPage({ params }: Props) {
  const { id } = await params
  const result: ApplicationDetailResult = await getApplicationDetail(id)

  if (!result.application) {
    return renderEmptyState()
  }

  const { application, events, error } = result

  return (
    <main className="min-h-screen bg-[var(--page-bg)] px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <BackToApplicationsButton className="text-sm font-medium text-emerald-700">
            ← 返回列表
          </BackToApplicationsButton>
          <StatusBadge status={application.status} />
        </div>

        <section className="rounded-[2rem] border border-slate-200/70 bg-[var(--card)] p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <p className="text-sm font-medium text-emerald-700">Application Detail</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-950">
            {application.company_name ?? '未命名公司'}
          </h1>
          <p className="mt-2 text-base text-slate-600">
            {application.job_title ?? '未填写岗位'}
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-500">
            <span>投递时间：{formatAppliedAt(application.applied_at)}</span>
            {application.source_url ? (
              <a
                href={application.source_url}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-emerald-700"
              >
                查看来源链接
              </a>
            ) : null}
          </div>
          <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-white/70 p-5">
            <h2 className="text-sm font-medium text-slate-800">投递备注</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {application.note ?? '暂无投递备注'}
            </p>
          </div>
          {error ? (
            <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
              {error}
            </p>
          ) : null}
        </section>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Timeline events={events} />
          <ApplicationDetailClient app={application} events={events} />
        </div>
      </div>
    </main>
  )
}
