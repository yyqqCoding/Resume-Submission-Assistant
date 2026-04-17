import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  fetchJobAgentJson,
  mapJobAgentSession,
  readOwnedApplicationForInterview,
} from '@/lib/interviews/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }

  const payload = await request.json()
  const applicationId = `${payload.applicationId ?? ''}`.trim()

  if (!applicationId) {
    return NextResponse.json({ error: 'INVALID_APPLICATION_ID' }, { status: 400 })
  }

  const application = await readOwnedApplicationForInterview(
    supabase,
    user.id,
    applicationId,
  )

  if (!application) {
    return NextResponse.json({ error: 'APPLICATION_NOT_FOUND' }, { status: 404 })
  }

  if (!application.company_name || !application.job_title) {
    return NextResponse.json(
      {
        error: '当前投递缺少公司或岗位信息，无法发起模拟面试',
      },
      { status: 400 },
    )
  }

  try {
    const session = await fetchJobAgentJson<any>('/api/interview-sessions', {
      method: 'POST',
      body: JSON.stringify({
        user_id: user.id,
        application_id: application.id,
        company: application.company_name,
        role: application.job_title,
        question_count: 3,
      }),
    })

    return NextResponse.json(mapJobAgentSession(session))
  } catch (jobAgentError) {
    return NextResponse.json(
      {
        error:
          jobAgentError instanceof Error
            ? jobAgentError.message
            : 'JOBAGENT_REQUEST_FAILED',
      },
      { status: 502 },
    )
  }
}
