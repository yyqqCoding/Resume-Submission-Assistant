import type {
  InterviewAnswerResultView,
  InterviewSessionView,
} from '@/types/interview'

async function readJson<T>(response: Response): Promise<T> {
  const payload = await response.json()

  if (!response.ok) {
    throw new Error(
      typeof payload?.error === 'string' ? payload.error : 'INTERVIEW_REQUEST_FAILED',
    )
  }

  return payload as T
}

export async function startInterviewSession(applicationId: string) {
  const response = await fetch('/api/interviews/start', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ applicationId }),
  })

  return readJson<InterviewSessionView>(response)
}

export async function getInterviewSession(sessionId: string, applicationId: string) {
  const response = await fetch(
    `/api/interviews/session/${sessionId}?applicationId=${encodeURIComponent(applicationId)}`,
    {
      cache: 'no-store',
    },
  )

  return readJson<InterviewSessionView>(response)
}

export async function submitInterviewAnswer(input: {
  sessionId: string
  applicationId: string
  answer: string
}) {
  const response = await fetch(`/api/interviews/session/${input.sessionId}/answer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  })

  return readJson<InterviewAnswerResultView>(response)
}
