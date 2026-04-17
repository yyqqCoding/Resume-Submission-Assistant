import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  fetchJobAgentJson,
  type JobAgentSessionRaw,
  mapJobAgentSession,
} from '@/lib/interviews/server'

type RouteContext = {
  params: Promise<{ sessionId: string }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }

  const { sessionId } = await context.params
  const applicationId = request.nextUrl.searchParams.get('applicationId')

  if (!applicationId) {
    return NextResponse.json({ error: 'INVALID_APPLICATION_ID' }, { status: 400 })
  }

  try {
    const rawSession = await fetchJobAgentJson<JobAgentSessionRaw>(
      `/api/interview-sessions/${sessionId}`,
      { method: 'GET' },
    )

    if (rawSession.user_id !== user.id || rawSession.application_id !== applicationId) {
      return NextResponse.json({ error: 'SESSION_ACCESS_DENIED' }, { status: 403 })
    }

    return NextResponse.json(mapJobAgentSession(rawSession))
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
