export type InterviewQuestionView = {
  id: string
  topic: string
  question: string
  questionKind: 'primary' | 'follow_up'
  evidenceLabel: string
  difficulty: string | null
  expectedSignals: string[]
}

export type InterviewProgressView = {
  currentIndex: number
  answeredCount: number
  totalQuestions: number
  completed: boolean
}

export type InterviewTurnView = {
  questionId: string
  answer: string
  score: number
  shortFeedback: string
  topic: string
  questionKind: 'primary' | 'follow_up'
}

export type InterviewSessionSummaryView = {
  totalQuestions: number
  answeredCount: number
  averageScore: number
  topics: string[]
  completed: boolean
}

export type InterviewMemoryUpdateView = {
  memoryStatus?: string
  classification?: string
  topicUpdates?: Array<{ topic: string }>
}

export type InterviewSessionView = {
  sessionId: string
  applicationId: string
  company: string
  role: string
  currentQuestion: InterviewQuestionView | null
  progress: InterviewProgressView
  completed: boolean
  researchSummary: Record<string, unknown>
  turns: InterviewTurnView[]
  sessionSummary: InterviewSessionSummaryView | null
}

export type InterviewAnswerResultView = {
  decision: 'follow_up' | 'next_question' | 'session_completed'
  evaluation: {
    score: number
    shortFeedback: string
    followUpNeeded?: boolean
  }
  currentQuestion: InterviewQuestionView | null
  nextQuestion: InterviewQuestionView | null
  progress: InterviewProgressView
  sessionSummary: InterviewSessionSummaryView | null
  memoryUpdate: InterviewMemoryUpdateView | null
  remarkSync: {
    status: 'skipped' | 'success' | 'failed'
    message: string
  }
}
