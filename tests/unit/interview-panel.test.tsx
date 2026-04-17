import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { JSDOM } from 'jsdom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Application } from '@/types'

const {
  startInterviewSessionMock,
  getInterviewSessionMock,
  submitInterviewAnswerMock,
} = vi.hoisted(() => ({
  startInterviewSessionMock: vi.fn(),
  getInterviewSessionMock: vi.fn(),
  submitInterviewAnswerMock: vi.fn(),
}))

vi.mock('@/lib/interview-client', () => ({
  startInterviewSession: startInterviewSessionMock,
  getInterviewSession: getInterviewSessionMock,
  submitInterviewAnswer: submitInterviewAnswerMock,
}))

import InterviewPanel from '@/components/InterviewPanel'

const application: Application = {
  id: 'app-1',
  user_id: 'user-1',
  source_url: 'https://jobs.example.com/1',
  raw_title: null,
  company_name: 'OpenAI',
  job_title: 'Backend Engineer',
  status: 'interview_1',
  applied_at: '2026-04-01',
  note: 'original note',
  created_at: '2026-04-01T10:00:00Z',
  updated_at: '2026-04-01T10:00:00Z',
}

beforeEach(() => {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', {
    url: 'http://localhost',
  })

  vi.stubGlobal('window', dom.window)
  vi.stubGlobal('document', dom.window.document)
  vi.stubGlobal('navigator', dom.window.navigator)
  vi.stubGlobal('HTMLElement', dom.window.HTMLElement)
  vi.stubGlobal('Node', dom.window.Node)
  vi.stubGlobal('localStorage', dom.window.localStorage)
  vi.stubGlobal('getComputedStyle', dom.window.getComputedStyle)
  vi.stubGlobal('MutationObserver', dom.window.MutationObserver)

  localStorage.clear()
  startInterviewSessionMock.mockReset()
  getInterviewSessionMock.mockReset()
  submitInterviewAnswerMock.mockReset()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('InterviewPanel', () => {
  it('starts a session and stores the session id by application id', async () => {
    const user = userEvent.setup()

    startInterviewSessionMock.mockResolvedValue({
      sessionId: 'session-1',
      applicationId: 'app-1',
      company: 'OpenAI',
      role: 'Backend Engineer',
      currentQuestion: {
        id: 'q-001',
        topic: 'redis consistency',
        question: 'Redis 一致性怎么保证？',
        questionKind: 'primary',
        evidenceLabel: '公司面经题',
        difficulty: null,
        expectedSignals: ['double delete'],
      },
      progress: {
        currentIndex: 0,
        answeredCount: 0,
        totalQuestions: 3,
        completed: false,
      },
      completed: false,
      researchSummary: {
        topics: ['redis consistency'],
      },
      turns: [],
      sessionSummary: null,
    })

    render(<InterviewPanel app={application} />)

    await user.click(screen.getByRole('button', { name: '开始模拟面试' }))

    await waitFor(() => {
      expect(startInterviewSessionMock).toHaveBeenCalledWith('app-1')
    })
    expect(screen.getByText('Redis 一致性怎么保证？')).toBeInTheDocument()
    expect(localStorage.getItem('interview-session:app-1')).toBe('session-1')
  })

  it('restores an existing session from localStorage on mount', async () => {
    localStorage.setItem('interview-session:app-1', 'session-1')

    getInterviewSessionMock.mockResolvedValue({
      sessionId: 'session-1',
      applicationId: 'app-1',
      company: 'OpenAI',
      role: 'Backend Engineer',
      currentQuestion: {
        id: 'q-002',
        topic: 'mysql index',
        question: 'Explain EXPLAIN.',
        questionKind: 'primary',
        evidenceLabel: 'AI 出题',
        difficulty: null,
        expectedSignals: [],
      },
      progress: {
        currentIndex: 1,
        answeredCount: 1,
        totalQuestions: 3,
        completed: false,
      },
      completed: false,
      researchSummary: {
        topics: ['mysql index'],
      },
      turns: [],
      sessionSummary: null,
    })

    render(<InterviewPanel app={application} />)

    await waitFor(() => {
      expect(getInterviewSessionMock).toHaveBeenCalledWith('session-1', 'app-1')
    })
    expect(screen.getByText('Explain EXPLAIN.')).toBeInTheDocument()
    expect(screen.getByText('已回答 1 / 3')).toBeInTheDocument()
  })

  it('submits the answer, clears localStorage on completion, and shows remark sync feedback', async () => {
    const user = userEvent.setup()

    startInterviewSessionMock.mockResolvedValue({
      sessionId: 'session-1',
      applicationId: 'app-1',
      company: 'OpenAI',
      role: 'Backend Engineer',
      currentQuestion: {
        id: 'q-001',
        topic: 'redis consistency',
        question: 'Redis 一致性怎么保证？',
        questionKind: 'primary',
        evidenceLabel: '公司面经题',
        difficulty: null,
        expectedSignals: [],
      },
      progress: {
        currentIndex: 0,
        answeredCount: 0,
        totalQuestions: 1,
        completed: false,
      },
      completed: false,
      researchSummary: {
        topics: ['redis consistency'],
      },
      turns: [],
      sessionSummary: null,
    })

    submitInterviewAnswerMock.mockResolvedValue({
      decision: 'session_completed',
      evaluation: {
        score: 82,
        shortFeedback: '主链路比较清楚。',
      },
      currentQuestion: null,
      nextQuestion: null,
      progress: {
        currentIndex: 0,
        answeredCount: 1,
        totalQuestions: 1,
        completed: true,
      },
      sessionSummary: {
        totalQuestions: 1,
        answeredCount: 1,
        averageScore: 82,
        topics: ['redis consistency'],
        completed: true,
      },
      memoryUpdate: {
        classification: 'strength',
        topicUpdates: [{ topic: 'redis consistency' }],
      },
      remarkSync: {
        status: 'success',
        message: '已同步到当前投递面试记录',
      },
    })

    render(<InterviewPanel app={application} />)

    await user.click(screen.getByRole('button', { name: '开始模拟面试' }))
    await user.type(screen.getByLabelText('你的回答'), '先更新数据库，再删除缓存。')
    await user.click(screen.getByRole('button', { name: '提交当前回答' }))

    await waitFor(() => {
      expect(submitInterviewAnswerMock).toHaveBeenCalledWith({
        sessionId: 'session-1',
        applicationId: 'app-1',
        answer: '先更新数据库，再删除缓存。',
      })
    })

    expect(screen.getByText('平均分 82')).toBeInTheDocument()
    expect(screen.getByText('已同步到当前投递面试记录')).toBeInTheDocument()
    expect(localStorage.getItem('interview-session:app-1')).toBeNull()
  })
})
