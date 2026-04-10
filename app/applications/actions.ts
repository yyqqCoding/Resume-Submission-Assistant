'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { ApplicationStatus } from '@/types'

export type CreateApplicationResult = {
  error: string | null
}

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export async function createApplication(
  formData: FormData,
): Promise<CreateApplicationResult> {
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
