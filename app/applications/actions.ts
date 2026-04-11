'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  ALL_STATUSES,
  type Application,
  type ApplicationEvent,
  type ApplicationStatus,
} from '@/types'

export type ActionResult = {
  error: string | null
}

export type ApplicationDetailResult = {
  application: Application | null
  events: ApplicationEvent[]
  error: string | null
}

type ApplicationWithEvents = Application & {
  application_events?: ApplicationEvent[] | null
}

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function isValidApplicationStatus(value: string): value is ApplicationStatus {
  return ALL_STATUSES.includes(value as ApplicationStatus)
}

export async function createApplication(
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  const sourceUrl = `${formData.get('source_url') ?? ''}`.trim()
  const companyName = `${formData.get('company_name') ?? ''}`.trim()
  const jobTitle = `${formData.get('job_title') ?? ''}`.trim()
  const note = `${formData.get('note') ?? ''}`.trim()
  const appliedAt = `${formData.get('applied_at') ?? ''}`.trim()
  const status: ApplicationStatus = 'applied'

  if (!companyName) {
    return { error: '请填写公司名' }
  }

  if (!jobTitle) {
    return { error: '请填写岗位名' }
  }

  if (!appliedAt) {
    return { error: '请选择投递日期' }
  }

  if (sourceUrl && !isValidHttpUrl(sourceUrl)) {
    return { error: '请填写有效的投递链接' }
  }

  const { error } = await supabase.from('applications').insert({
    user_id: user.id,
    source_url: sourceUrl || null,
    raw_title: null,
    company_name: companyName,
    job_title: jobTitle,
    status,
    applied_at: appliedAt,
    note: note || null,
  })

  if (error) {
    return { error: '保存失败，请重试' }
  }

  return { error: null }
}

export async function updateApplicationStatus(
  id: string,
  newStatus: string,
): Promise<ActionResult> {
  if (!isValidApplicationStatus(newStatus)) {
    return { error: '无效的投递状态' }
  }

  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  const { error } = await supabase
    .from('applications')
    .update({ status: newStatus })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return { error: '更新失败，请重试' }
  }

  return { error: null }
}

export async function getApplicationDetail(
  id: string,
): Promise<ApplicationDetailResult> {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  const { data: application, error: applicationError } = await supabase
    .from('applications')
    .select('*, application_events(*)')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (applicationError) {
    return { application: null, events: [], error: '读取失败，请刷新重试' }
  }

  if (!application) {
    return { application: null, events: [], error: null }
  }

  const { application_events: rawEvents, ...applicationFields } =
    application as ApplicationWithEvents

  const events = [...(rawEvents ?? [])].sort((left, right) => {
    return (
      new Date(right.happened_at).getTime() -
      new Date(left.happened_at).getTime()
    )
  })

  return {
    application: applicationFields as Application,
    events,
    error: null,
  }
}

export async function updateLatestEventRemark(
  applicationId: string,
  remark: string,
): Promise<ActionResult> {
  const trimmedRemark = remark.trim()

  if (!trimmedRemark) {
    return { error: '请填写备注内容' }
  }

  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  const { data: application, error: applicationError } = await supabase
    .from('applications')
    .select('id')
    .eq('id', applicationId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (applicationError || !application) {
    return { error: '未找到这条投递记录' }
  }

  const { data: latestEvents, error: latestEventError } = await supabase
    .from('application_events')
    .select('id')
    .eq('application_id', applicationId)
    .order('happened_at', { ascending: false })
    .limit(1)

  if (latestEventError) {
    return { error: '读取时间线失败，请重试' }
  }

  const latestEvent = latestEvents?.[0]

  if (!latestEvent) {
    return { error: '暂无可更新的时间线事件' }
  }

  const { error } = await supabase
    .from('application_events')
    .update({ remark: trimmedRemark })
    .eq('id', latestEvent.id)

  if (error) {
    return { error: '备注更新失败，请重试' }
  }

  return { error: null }
}

export async function deleteApplication(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  const { error } = await supabase
    .from('applications')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return { error: '删除失败，请重试' }
  }

  return { error: null }
}
