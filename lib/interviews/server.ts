import { getJobAgentBaseUrl } from '@/lib/env'
import type {
  InterviewAnswerResultView,
  InterviewQuestionView,
  InterviewSessionView,
} from '@/types/interview'

type OwnedApplication = {
  id: string
  user_id: string
  company_name: string | null
  job_title: string | null
}

function toQuestionView(raw: any): InterviewQuestionView {
  return {
    id: raw.id,
    topic: raw.topic ?? 'unknown',
    question: raw.question ?? '',
    questionKind: raw.question_kind ?? 'primary',
    evidenceLabel: raw.evidence_label ?? 'AI 出题',
    difficulty: raw.difficulty ?? null,
    expectedSignals: Array.isArray(raw.expected_signals)
      ? raw.expected_signals
      : [],
  }
}

function toProgressView(raw: any) {
  return {
    currentIndex: Number(raw?.current_index ?? 0),
    answeredCount: Number(raw?.answered_count ?? 0),
    totalQuestions: Number(raw?.total_questions ?? 0),
    completed: Boolean(raw?.completed),
  }
}

export async function readOwnedApplicationForInterview(
  supabase: any,
  userId: string,
  applicationId: string,
): Promise<OwnedApplication | null> {
  const { data, error } = await supabase
    .from('applications')
    .select('id, user_id, company_name, job_title')
    .eq('id', applicationId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error || !data) {
    return null
  }

  return data as OwnedApplication
}

export async function fetchJobAgentJson<T>(
  path: string,
  init: RequestInit,
): Promise<T> {
  const response = await fetch(`${getJobAgentBaseUrl()}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
    cache: 'no-store',
  })

  const payload = await response.json()

  if (!response.ok) {
    const message =
      typeof payload?.detail?.message === 'string'
        ? payload.detail.message
        : 'JOBAGENT_REQUEST_FAILED'
    throw new Error(message)
  }

  return payload as T
}

export function mapJobAgentSession(raw: any): InterviewSessionView {
  return {
    sessionId: raw.session_id,
    applicationId: raw.application_id,
    company: raw.company,
    role: raw.role,
    currentQuestion: raw.current_question ? toQuestionView(raw.current_question) : null,
    progress: toProgressView(raw.progress),
    completed: Boolean(raw.completed),
    researchSummary: raw.research_summary ?? {},
    turns: Array.isArray(raw.turns)
      ? raw.turns.map((turn: any) => ({
          questionId: turn.question_id,
          answer: turn.answer,
          score: Number(turn.score ?? 0),
          shortFeedback: turn.short_feedback ?? '',
          topic: turn.topic ?? 'unknown',
          questionKind: turn.question_kind ?? 'primary',
        }))
      : [],
    sessionSummary: raw.session_summary
      ? {
          totalQuestions: Number(raw.session_summary.total_questions ?? 0),
          answeredCount: Number(raw.session_summary.answered_count ?? 0),
          averageScore: Number(raw.session_summary.average_score ?? 0),
          topics: Array.isArray(raw.session_summary.topics)
            ? raw.session_summary.topics
            : [],
          completed: Boolean(raw.session_summary.completed),
        }
      : null,
  }
}

export function mapJobAgentAnswerResult(raw: any): InterviewAnswerResultView {
  return {
    decision: raw.decision,
    evaluation: {
      score: Number(raw.evaluation?.score ?? 0),
      shortFeedback: raw.evaluation?.short_feedback ?? '',
      followUpNeeded: Boolean(raw.evaluation?.follow_up_needed),
    },
    currentQuestion: raw.current_question ? toQuestionView(raw.current_question) : null,
    nextQuestion: raw.next_question ? toQuestionView(raw.next_question) : null,
    progress: toProgressView(raw.progress),
    sessionSummary: raw.session_summary
      ? {
          totalQuestions: Number(raw.session_summary.total_questions ?? 0),
          answeredCount: Number(raw.session_summary.answered_count ?? 0),
          averageScore: Number(raw.session_summary.average_score ?? 0),
          topics: Array.isArray(raw.session_summary.topics)
            ? raw.session_summary.topics
            : [],
          completed: Boolean(raw.session_summary.completed),
        }
      : null,
    memoryUpdate: raw.memory_update ?? null,
    remarkSync: {
      status: 'skipped',
      message: '',
    },
  }
}
