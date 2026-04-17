import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  appendInterviewSummaryToLatestRemark,
  buildInterviewSummaryRemark,
  fetchJobAgentJson,
  mapJobAgentAnswerResult,
  readOwnedApplicationForInterview,
} from '@/lib/interviews/server'

type RouteContext = {
  params: Promise<{ sessionId: string }>
}

export async function POST(request: NextRequest, context: RouteContext) {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }

  const { sessionId } = await context.params
  const payload = await request.json()
  const applicationId = `${payload.applicationId ?? ''}`.trim()
  const answer = `${payload.answer ?? ''}`.trim()

  if (!applicationId) {
    return NextResponse.json({ error: 'INVALID_APPLICATION_ID' }, { status: 400 })
  }

  if (!answer) {
    return NextResponse.json({ error: '请先填写回答内容。' }, { status: 400 })
  }

  try {
    const application = await readOwnedApplicationForInterview(
      supabase,
      user.id,
      applicationId,
    )

    if (!application) {
      return NextResponse.json({ error: 'APPLICATION_NOT_FOUND' }, { status: 404 })
    }

    const rawResult = await fetchJobAgentJson<any>(
      `/api/interview-sessions/${sessionId}/answers`,
      {
        method: 'POST',
        body: JSON.stringify({ answer }),
      },
    )

    const result = mapJobAgentAnswerResult(rawResult)

    if (result.decision !== 'session_completed') {
      return NextResponse.json(result)
    }

    const summary = buildInterviewSummaryRemark({
      company: application.company_name ?? '未知公司',
      role: application.job_title ?? '未知岗位',
      sessionSummary: result.sessionSummary,
      memoryUpdate: result.memoryUpdate,
      evaluation: result.evaluation,
    })

    const remarkSync = await appendInterviewSummaryToLatestRemark({
      supabase,
      applicationId,
      summary,
    })

    return NextResponse.json({
      ...result,
      remarkSync,
    })
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
