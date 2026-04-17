// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const {
  createClientMock,
  getUserMock,
  fromMock,
  latestSelectMock,
  latestApplicationEqMock,
  latestOrderMock,
  latestLimitMock,
  latestUpdateMock,
  latestUpdateEqMock,
  fetchJobAgentJsonMock,
  readOwnedApplicationForInterviewMock,
} = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  getUserMock: vi.fn(),
  fromMock: vi.fn(),
  latestSelectMock: vi.fn(),
  latestApplicationEqMock: vi.fn(),
  latestOrderMock: vi.fn(),
  latestLimitMock: vi.fn(),
  latestUpdateMock: vi.fn(),
  latestUpdateEqMock: vi.fn(),
  fetchJobAgentJsonMock: vi.fn(),
  readOwnedApplicationForInterviewMock: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: createClientMock,
}))

vi.mock('@/lib/interviews/server', async () => {
  const actual = await vi.importActual<typeof import('@/lib/interviews/server')>(
    '@/lib/interviews/server',
  )
  return {
    ...actual,
    fetchJobAgentJson: fetchJobAgentJsonMock,
    readOwnedApplicationForInterview: readOwnedApplicationForInterviewMock,
  }
})

import { GET } from '@/app/api/interviews/session/[sessionId]/route'
import { POST } from '@/app/api/interviews/session/[sessionId]/answer/route'

describe('interview session routes', () => {
  beforeEach(() => {
    createClientMock.mockReset()
    getUserMock.mockReset()
    fromMock.mockReset()
    latestSelectMock.mockReset()
    latestApplicationEqMock.mockReset()
    latestOrderMock.mockReset()
    latestLimitMock.mockReset()
    latestUpdateMock.mockReset()
    latestUpdateEqMock.mockReset()
    fetchJobAgentJsonMock.mockReset()
    readOwnedApplicationForInterviewMock.mockReset()

    createClientMock.mockResolvedValue({
      auth: { getUser: getUserMock },
      from: fromMock,
    })

    readOwnedApplicationForInterviewMock.mockResolvedValue({
      id: 'app-1',
      user_id: 'user-1',
      company_name: 'OpenAI',
      job_title: 'Backend Engineer',
    })
  })

  it('returns 403 when the restored session does not belong to the requested application', async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    })
    fetchJobAgentJsonMock.mockResolvedValue({
      session_id: 'session-1',
      user_id: 'user-1',
      application_id: 'app-2',
      company: 'OpenAI',
      role: 'Backend Engineer',
      current_question: null,
      progress: {
        current_index: 0,
        answered_count: 0,
        total_questions: 3,
        completed: false,
      },
      completed: false,
      research_summary: {},
      turns: [],
      session_summary: null,
    })

    const response = await GET(
      new NextRequest(
        'https://app.local/api/interviews/session/session-1?applicationId=app-1',
      ),
      {
        params: Promise.resolve({ sessionId: 'session-1' }),
      },
    )

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({
      error: 'SESSION_ACCESS_DENIED',
    })
  })

  it('returns the mapped session when restore succeeds', async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    })
    fetchJobAgentJsonMock.mockResolvedValue({
      session_id: 'session-1',
      user_id: 'user-1',
      application_id: 'app-1',
      company: 'OpenAI',
      role: 'Backend Engineer',
      current_question: {
        id: 'q-002',
        topic: 'mysql index',
        question: 'Explain EXPLAIN.',
        evidence_label: 'AI 出题',
        question_kind: 'primary',
        expected_signals: [],
      },
      progress: {
        current_index: 1,
        answered_count: 1,
        total_questions: 3,
        completed: false,
      },
      completed: false,
      research_summary: {
        topics: ['mysql index'],
      },
      turns: [],
      session_summary: null,
    })

    const response = await GET(
      new NextRequest(
        'https://app.local/api/interviews/session/session-1?applicationId=app-1',
      ),
      {
        params: Promise.resolve({ sessionId: 'session-1' }),
      },
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({
        sessionId: 'session-1',
        applicationId: 'app-1',
        currentQuestion: expect.objectContaining({
          id: 'q-002',
        }),
      }),
    )
  })

  it('appends the final AI summary to the latest event remark on session completion', async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    })

    fetchJobAgentJsonMock.mockResolvedValue({
      decision: 'session_completed',
      evaluation: {
        score: 82,
        short_feedback: '主链路比较清楚。',
        follow_up_needed: false,
      },
      progress: {
        current_index: 2,
        answered_count: 3,
        total_questions: 3,
        completed: true,
      },
      session_summary: {
        total_questions: 3,
        answered_count: 3,
        average_score: 78,
        topics: ['redis consistency', 'mq reliability'],
        completed: true,
      },
      memory_update: {
        memory_status: 'persisted',
        classification: 'strength',
        topic_updates: [{ topic: 'redis consistency' }],
      },
    })

    const latestEventsTable = {
      select: latestSelectMock,
      update: latestUpdateMock,
    }

    latestSelectMock.mockReturnValue({
      eq: latestApplicationEqMock,
    })
    latestApplicationEqMock.mockReturnValue({
      order: latestOrderMock,
    })
    latestOrderMock.mockReturnValue({
      limit: latestLimitMock,
    })
    latestLimitMock.mockResolvedValue({
      data: [{ id: 'event-2', remark: '原有面试记录' }],
      error: null,
    })
    latestUpdateMock.mockReturnValue({
      eq: latestUpdateEqMock,
    })
    latestUpdateEqMock.mockResolvedValue({ error: null })

    fromMock.mockImplementation((table: string) => {
      if (table === 'application_events') {
        return latestEventsTable
      }

      throw new Error(`unexpected table:${table}`)
    })

    const response = await POST(
      new NextRequest('https://app.local/api/interviews/session/session-1/answer', {
        method: 'POST',
        body: JSON.stringify({
          applicationId: 'app-1',
          answer: '先更新数据库，再删除缓存，并补偿重试。',
        }),
      }),
      {
        params: Promise.resolve({ sessionId: 'session-1' }),
      },
    )

    expect(response.status).toBe(200)
    expect(latestUpdateEqMock).toHaveBeenCalledWith('id', 'event-2')
    expect(latestUpdateMock).toHaveBeenCalledWith({
      remark: expect.stringContaining('## 模拟面试总结（AI）'),
    })
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({
        decision: 'session_completed',
        remarkSync: {
          status: 'success',
          message: '已同步到当前投递面试记录',
        },
      }),
    )
  })
})
