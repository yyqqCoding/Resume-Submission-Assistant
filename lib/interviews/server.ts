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

type JobAgentQuestionRaw = {
  id: string
  topic?: string
  question?: string
  evidence_label?: string
  difficulty?: string | null
  expected_signals?: unknown
  question_kind?: 'primary' | 'follow_up'
}

type JobAgentProgressRaw = {
  current_index?: number
  answered_count?: number
  total_questions?: number
  completed?: boolean
}

type JobAgentTurnRaw = {
  question_id: string
  answer: string
  score?: number
  short_feedback?: string
  topic?: string
  question_kind?: 'primary' | 'follow_up'
}

export type JobAgentSessionRaw = {
  session_id: string
  user_id: string
  application_id: string
  company: string
  role: string
  current_question?: JobAgentQuestionRaw | null
  progress?: JobAgentProgressRaw
  completed?: boolean
  research_summary?: Record<string, unknown>
  turns?: JobAgentTurnRaw[]
  session_summary?: {
    total_questions?: number
    answered_count?: number
    average_score?: number
    topics?: unknown
    completed?: boolean
  } | null
}

export type JobAgentAnswerRaw = {
  decision: 'follow_up' | 'next_question' | 'session_completed'
  evaluation?: {
    score?: number
    short_feedback?: string
    follow_up_needed?: boolean
  }
  current_question?: JobAgentQuestionRaw | null
  next_question?: JobAgentQuestionRaw | null
  progress?: JobAgentProgressRaw
  session_summary?: {
    total_questions?: number
    answered_count?: number
    average_score?: number
    topics?: unknown
    completed?: boolean
  } | null
  memory_update?: InterviewAnswerResultView['memoryUpdate']
}

type JobAgentErrorPayload = {
  detail?: {
    message?: string
  }
}

type ApplicationsLookupBuilder = {
  select: (columns: string) => {
    eq: (column: string, value: string) => {
      eq: (column: string, value: string) => {
        maybeSingle: () => Promise<{
          data: OwnedApplication | null
          error: unknown
        }>
      }
    }
  }
}

type ApplicationEventsSelectBuilder = {
  select: (columns: string) => {
    eq: (column: string, value: string) => {
      order: (
        column: string,
        options: { ascending: boolean },
      ) => {
        limit: (count: number) => Promise<{
          data: Array<{ id: string; remark: string | null }> | null
          error: unknown
        }>
      }
    }
  }
}

type ApplicationEventsUpdateBuilder = {
  update: (payload: { remark: string }) => {
    eq: (column: string, value: string) => Promise<{ error: unknown }>
  }
}

type SupabaseLike = {
  from: (table: string) => unknown
}

function toQuestionView(raw: JobAgentQuestionRaw): InterviewQuestionView {
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

function toProgressView(raw?: JobAgentProgressRaw) {
  return {
    currentIndex: Number(raw?.current_index ?? 0),
    answeredCount: Number(raw?.answered_count ?? 0),
    totalQuestions: Number(raw?.total_questions ?? 0),
    completed: Boolean(raw?.completed),
  }
}

export async function readOwnedApplicationForInterview(
  supabase: unknown,
  userId: string,
  applicationId: string,
): Promise<OwnedApplication | null> {
  const applicationsTable = (supabase as SupabaseLike).from(
    'applications',
  ) as ApplicationsLookupBuilder

  const { data, error } = await applicationsTable
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

  const payload: JobAgentErrorPayload | T = await response.json()

  if (!response.ok) {
    const errorPayload = payload as JobAgentErrorPayload
    const message =
      typeof errorPayload.detail?.message === 'string'
        ? errorPayload.detail.message
        : 'JOBAGENT_REQUEST_FAILED'
    throw new Error(message)
  }

  return payload as T
}

export function mapJobAgentSession(raw: JobAgentSessionRaw): InterviewSessionView {
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
      ? raw.turns.map((turn) => ({
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

export function mapJobAgentAnswerResult(
  raw: JobAgentAnswerRaw,
): InterviewAnswerResultView {
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

export function buildInterviewSummaryRemark(input: {
  company: string
  role: string
  sessionSummary: {
    totalQuestions: number
    answeredCount: number
    averageScore: number
    topics: string[]
  } | null
  memoryUpdate: {
    classification?: string
    topicUpdates?: Array<{ topic: string }>
  } | null
  evaluation: {
    shortFeedback: string
  }
}) {
  const topics = input.sessionSummary?.topics ?? []
  const memoryTopics = input.memoryUpdate?.topicUpdates ?? []

  return [
    '## 模拟面试总结（AI）',
    `- 公司：${input.company}`,
    `- 岗位：${input.role}`,
    `- 总题数：${input.sessionSummary?.totalQuestions ?? 0}`,
    `- 已完成：${input.sessionSummary?.answeredCount ?? 0}`,
    `- 平均分：${input.sessionSummary?.averageScore ?? 0}`,
    '',
    '### 题目主题',
    ...(topics.length ? topics.map((topic) => `- ${topic}`) : ['- 暂无主题']),
    '',
    '### 记忆沉淀',
    `- 分类：${input.memoryUpdate?.classification ?? 'unknown'}`,
    ...(memoryTopics.length
      ? memoryTopics.map((item) => `- ${item.topic}`)
      : ['- 暂无主题沉淀']),
    '',
    '### AI总结',
    `- ${input.evaluation.shortFeedback || '本轮已完成模拟面试。'}`,
  ].join('\n')
}

export async function appendInterviewSummaryToLatestRemark(input: {
  supabase: unknown
  applicationId: string
  summary: string
}) {
  const applicationEventsTable = (input.supabase as SupabaseLike).from(
    'application_events',
  ) as ApplicationEventsSelectBuilder

  const { data, error } = await applicationEventsTable
    .select('id, remark')
    .eq('application_id', input.applicationId)
    .order('happened_at', { ascending: false })
    .limit(1)

  if (error || !data?.length) {
    return {
      status: 'failed' as const,
      message: '模拟面试已完成，但同步投递记录失败',
    }
  }

  const latest = data[0]
  const nextRemark = latest.remark
    ? `${latest.remark.trim()}\n\n${input.summary}`
    : input.summary

  const applicationEventsUpdateTable = (input.supabase as SupabaseLike).from(
    'application_events',
  ) as ApplicationEventsUpdateBuilder

  const { error: updateError } = await applicationEventsUpdateTable
    .update({ remark: nextRemark })
    .eq('id', latest.id)

  if (updateError) {
    return {
      status: 'failed' as const,
      message: '模拟面试已完成，但同步投递记录失败',
    }
  }

  return {
    status: 'success' as const,
    message: '已同步到当前投递面试记录',
  }
}
