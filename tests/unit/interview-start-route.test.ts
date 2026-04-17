// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const {
  createClientMock,
  getUserMock,
  fromMock,
  selectMock,
  idEqMock,
  userEqMock,
  maybeSingleMock,
  getJobAgentBaseUrlMock,
  fetchMock,
} = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  getUserMock: vi.fn(),
  fromMock: vi.fn(),
  selectMock: vi.fn(),
  idEqMock: vi.fn(),
  userEqMock: vi.fn(),
  maybeSingleMock: vi.fn(),
  getJobAgentBaseUrlMock: vi.fn(() => 'http://jobagent.local'),
  fetchMock: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: createClientMock,
}))

vi.mock('@/lib/env', async () => {
  const actual = await vi.importActual<typeof import('@/lib/env')>('@/lib/env')
  return {
    ...actual,
    getJobAgentBaseUrl: getJobAgentBaseUrlMock,
  }
})

import { POST } from '@/app/api/interviews/start/route'

describe('interview start route', () => {
  beforeEach(() => {
    createClientMock.mockReset()
    getUserMock.mockReset()
    fromMock.mockReset()
    selectMock.mockReset()
    idEqMock.mockReset()
    userEqMock.mockReset()
    maybeSingleMock.mockReset()
    getJobAgentBaseUrlMock.mockClear()
    fetchMock.mockReset()

    createClientMock.mockResolvedValue({
      auth: { getUser: getUserMock },
      from: fromMock,
    })

    fromMock.mockReturnValue({
      select: selectMock,
    })
    selectMock.mockReturnValue({
      eq: idEqMock,
    })
    idEqMock.mockReturnValue({
      eq: userEqMock,
    })
    userEqMock.mockReturnValue({
      maybeSingle: maybeSingleMock,
    })

    vi.stubGlobal('fetch', fetchMock)
  })

  it('returns 401 when the current user is missing', async () => {
    getUserMock.mockResolvedValue({
      data: { user: null },
      error: null,
    })

    const response = await POST(
      new NextRequest('https://app.local/api/interviews/start', {
        method: 'POST',
        body: JSON.stringify({ applicationId: 'app-1' }),
      }),
    )

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({
      error: 'UNAUTHORIZED',
    })
  })

  it('returns 400 when the owned application is missing company or role', async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    })
    maybeSingleMock.mockResolvedValue({
      data: {
        id: 'app-1',
        user_id: 'user-1',
        company_name: null,
        job_title: 'Backend Engineer',
      },
      error: null,
    })

    const response = await POST(
      new NextRequest('https://app.local/api/interviews/start', {
        method: 'POST',
        body: JSON.stringify({ applicationId: 'app-1' }),
      }),
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: '当前投递缺少公司或岗位信息，无法发起模拟面试',
    })
  })

  it('starts a JobAgent session for the owned application', async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    })
    maybeSingleMock.mockResolvedValue({
      data: {
        id: 'app-1',
        user_id: 'user-1',
        company_name: 'OpenAI',
        job_title: 'Backend Engineer',
      },
      error: null,
    })
    fetchMock.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        session_id: 'session-1',
        user_id: 'user-1',
        application_id: 'app-1',
        company: 'OpenAI',
        role: 'Backend Engineer',
        current_question: {
          id: 'q-001',
          topic: 'redis consistency',
          question: 'Redis 一致性怎么保证？',
          evidence_label: '公司面经题',
          question_kind: 'primary',
          expected_signals: ['double delete'],
        },
        progress: {
          current_index: 0,
          answered_count: 0,
          total_questions: 3,
          completed: false,
        },
        completed: false,
        research_summary: {
          topics: ['redis consistency'],
        },
        turns: [],
        session_summary: null,
      }),
    })

    const response = await POST(
      new NextRequest('https://app.local/api/interviews/start', {
        method: 'POST',
        body: JSON.stringify({ applicationId: 'app-1' }),
      }),
    )

    expect(fetchMock).toHaveBeenCalledWith(
      'http://jobagent.local/api/interview-sessions',
      expect.objectContaining({
        method: 'POST',
      }),
    )

    const requestInit = fetchMock.mock.calls[0]?.[1]
    expect(requestInit?.body).toContain('"user_id":"user-1"')
    expect(requestInit?.body).toContain('"application_id":"app-1"')
    expect(requestInit?.body).toContain('"company":"OpenAI"')
    expect(requestInit?.body).toContain('"role":"Backend Engineer"')
    expect(requestInit?.body).toContain('"question_count":3')

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      sessionId: 'session-1',
      applicationId: 'app-1',
      company: 'OpenAI',
      role: 'Backend Engineer',
      currentQuestion: expect.objectContaining({
        id: 'q-001',
        question: 'Redis 一致性怎么保证？',
      }),
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
  })
})
