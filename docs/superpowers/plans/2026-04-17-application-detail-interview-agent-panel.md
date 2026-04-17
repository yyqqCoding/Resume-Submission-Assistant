# Application Detail Interview Agent Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a JobAgent-backed interview panel to the application detail page so users can start, restore, answer, and complete a mock interview without leaving the existing application workflow, and append the final AI summary to the latest application event remark.

**Architecture:** Introduce `/api/interviews/*` route handlers as the only integration layer between the Next.js app and JobAgent. Keep request/response mapping and remark-appending logic in a focused server helper, use a small browser client for the panel, and mount a client-side interview panel into the existing detail sidebar with `localStorage` recovery keyed by `applicationId`.

**Tech Stack:** Next.js 15 route handlers, React 19, TypeScript, Supabase server client, Vitest, Testing Library

---

## File Structure

- Create: `app/api/interviews/start/route.ts`
  Starts a JobAgent session from an owned application.
- Create: `app/api/interviews/session/[sessionId]/route.ts`
  Restores an existing JobAgent session after validating user and application ownership.
- Create: `app/api/interviews/session/[sessionId]/answer/route.ts`
  Submits an answer, maps the JobAgent result, and appends the final AI summary to the latest `application_events.remark`.
- Create: `components/InterviewPanel.tsx`
  Renders the detail-page interview UI and handles `localStorage` recovery.
- Create: `lib/interview-client.ts`
  Wraps browser calls to `/api/interviews/*`.
- Create: `lib/interviews/server.ts`
  Shared route-layer helper for owned-application lookup, JobAgent mapping, and remark summary generation.
- Create: `types/interview.ts`
  Central interview types for route outputs and client consumption.
- Create: `tests/unit/interview-start-route.test.ts`
  Covers the start BFF route.
- Create: `tests/unit/interview-session-routes.test.ts`
  Covers the restore route and answer route with remark sync.
- Create: `tests/unit/interview-panel.test.tsx`
  Covers panel start, restore, answer, and completed flows.
- Modify: `lib/env.ts`
  Adds `getJobAgentBaseUrl`.
- Modify: `tests/unit/env.test.ts`
  Verifies `getJobAgentBaseUrl`.
- Modify: `components/ApplicationDetailClient.tsx`
  Mounts the new interview panel inside the existing sidebar.
- Modify: `tests/unit/application-detail-client.test.tsx`
  Verifies the interview panel is rendered without regressing existing detail actions.
- Modify: `README.md`
  Documents `JOBAGENT_BASE_URL` for local and deployed environments.
- Delete: `tests/unit/interview-agent-actions.test.ts`
  Removes the old server-action-based integration path.
- Delete: `tests/unit/interview-agent-panel.test.tsx`
  Removes the old query-string-driven panel draft.

### Task 1: Add the JobAgent Environment Contract

**Files:**
- Modify: `lib/env.ts`
- Modify: `tests/unit/env.test.ts`

- [ ] **Step 1: Make the env test explicitly cover `JOBAGENT_BASE_URL` normalization**

```ts
// @vitest-environment node

import { describe, expect, it } from 'vitest'
import { getJobAgentBaseUrl, getPublicEnv } from '@/lib/env'

describe('getPublicEnv', () => {
  it('returns the required public supabase env values', () => {
    expect(
      getPublicEnv({
        NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
      }),
    ).toEqual({
      url: 'https://example.supabase.co',
      anonKey: 'anon-key',
    })
  })

  it('throws when one of the required values is missing', () => {
    expect(() =>
      getPublicEnv({
        NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      }),
    ).toThrow('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.')
  })

  it('returns the normalized JobAgent base url', () => {
    expect(
      getJobAgentBaseUrl({
        JOBAGENT_BASE_URL: 'http://127.0.0.1:18090/',
      }),
    ).toBe('http://127.0.0.1:18090')
  })

  it('throws when JOBAGENT_BASE_URL is missing', () => {
    expect(() => getJobAgentBaseUrl({})).toThrow('Missing JOBAGENT_BASE_URL.')
  })
})
```

- [ ] **Step 2: Run the env test and confirm it fails before implementation**

Run: `npx vitest run tests/unit/env.test.ts`

Expected: FAIL because `getJobAgentBaseUrl` is not exported from [`lib/env.ts`](/mnt/e/JavaProject/Resume-Submission-Assistant/lib/env.ts).

- [ ] **Step 3: Implement `getJobAgentBaseUrl` in the env helper**

```ts
type PublicEnvSource = Readonly<Record<string, string | undefined>>

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '')
}

export function getPublicEnv(source: PublicEnvSource = process.env) {
  const url = source.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const anonKey = source.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

  if (!url || !anonKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.',
    )
  }

  return { url, anonKey }
}

export function getSiteUrl(source: PublicEnvSource = process.env) {
  const siteUrl = source.NEXT_PUBLIC_SITE_URL?.trim()

  if (!siteUrl) {
    throw new Error('Missing NEXT_PUBLIC_SITE_URL.')
  }

  return trimTrailingSlash(siteUrl)
}

export function getJobAgentBaseUrl(source: PublicEnvSource = process.env) {
  const baseUrl = source.JOBAGENT_BASE_URL?.trim()

  if (!baseUrl) {
    throw new Error('Missing JOBAGENT_BASE_URL.')
  }

  return trimTrailingSlash(baseUrl)
}
```

- [ ] **Step 4: Run the env test again**

Run: `npx vitest run tests/unit/env.test.ts`

Expected: PASS with 4 passing assertions.

- [ ] **Step 5: Commit the env contract change**

```bash
git add lib/env.ts tests/unit/env.test.ts
git commit -m "test: cover jobagent env contract"
```

### Task 2: Implement the Start Route and Shared Interview Mapping

**Files:**
- Create: `types/interview.ts`
- Create: `lib/interviews/server.ts`
- Create: `app/api/interviews/start/route.ts`
- Create: `tests/unit/interview-start-route.test.ts`

- [ ] **Step 1: Write failing tests for the start route**

```ts
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
```

- [ ] **Step 2: Run the new start-route test and confirm it fails**

Run: `npx vitest run tests/unit/interview-start-route.test.ts`

Expected: FAIL because [`app/api/interviews/start/route.ts`](/mnt/e/JavaProject/Resume-Submission-Assistant/app/api/interviews/start/route.ts), [`types/interview.ts`](/mnt/e/JavaProject/Resume-Submission-Assistant/types/interview.ts), and [`lib/interviews/server.ts`](/mnt/e/JavaProject/Resume-Submission-Assistant/lib/interviews/server.ts) do not exist yet.

- [ ] **Step 3: Implement the shared interview types, server helper, and start route**

```ts
// types/interview.ts
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
```

```ts
// lib/interviews/server.ts
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

  return data satisfies OwnedApplication
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
```

```ts
// app/api/interviews/start/route.ts
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
```

- [ ] **Step 4: Run the start-route test again**

Run: `npx vitest run tests/unit/interview-start-route.test.ts`

Expected: PASS with the start-route scenarios covered.

- [ ] **Step 5: Commit the shared interview contract and start route**

```bash
git add app/api/interviews/start/route.ts lib/interviews/server.ts lib/env.ts tests/unit/env.test.ts tests/unit/interview-start-route.test.ts types/interview.ts
git commit -m "feat: add interview start route"
```

### Task 3: Implement Session Restore and Answer Routes with Remark Sync

**Files:**
- Create: `app/api/interviews/session/[sessionId]/route.ts`
- Create: `app/api/interviews/session/[sessionId]/answer/route.ts`
- Create: `tests/unit/interview-session-routes.test.ts`
- Modify: `lib/interviews/server.ts`

- [ ] **Step 1: Write failing tests for session restore and answer submission**

```ts
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
```

- [ ] **Step 2: Run the session-route test and confirm it fails**

Run: `npx vitest run tests/unit/interview-session-routes.test.ts`

Expected: FAIL because the session restore route and answer route do not exist yet, and remark-sync helpers are not implemented.

- [ ] **Step 3: Implement the restore route, answer route, and remark-sync helper**

```ts
// lib/interviews/server.ts
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
  supabase: any
  applicationId: string
  summary: string
}) {
  const { data, error } = await input.supabase
    .from('application_events')
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

  const { error: updateError } = await input.supabase
    .from('application_events')
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
```

```ts
// app/api/interviews/session/[sessionId]/route.ts
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchJobAgentJson, mapJobAgentSession } from '@/lib/interviews/server'

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
    const rawSession = await fetchJobAgentJson<any>(
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
```

```ts
// app/api/interviews/session/[sessionId]/answer/route.ts
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
```

- [ ] **Step 4: Run the session-route test again**

Run: `npx vitest run tests/unit/interview-session-routes.test.ts`

Expected: PASS with restore and completed-answer remark-sync coverage.

- [ ] **Step 5: Commit the restore and answer route work**

```bash
git add app/api/interviews/session/[sessionId]/route.ts app/api/interviews/session/[sessionId]/answer/route.ts lib/interviews/server.ts tests/unit/interview-session-routes.test.ts types/interview.ts
git commit -m "feat: add interview session routes"
```

### Task 4: Build the Browser Interview Client and Panel

**Files:**
- Create: `lib/interview-client.ts`
- Create: `components/InterviewPanel.tsx`
- Create: `tests/unit/interview-panel.test.tsx`
- Delete: `tests/unit/interview-agent-panel.test.tsx`

- [ ] **Step 1: Write failing panel tests for start, restore, and submit flows**

```tsx
// @vitest-environment jsdom

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
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
  localStorage.clear()
  startInterviewSessionMock.mockReset()
  getInterviewSessionMock.mockReset()
  submitInterviewAnswerMock.mockReset()
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
```

- [ ] **Step 2: Run the panel test and confirm it fails**

Run: `npx vitest run tests/unit/interview-panel.test.tsx`

Expected: FAIL because [`components/InterviewPanel.tsx`](/mnt/e/JavaProject/Resume-Submission-Assistant/components/InterviewPanel.tsx) and [`lib/interview-client.ts`](/mnt/e/JavaProject/Resume-Submission-Assistant/lib/interview-client.ts) do not exist yet.

- [ ] **Step 3: Implement the browser client and interview panel**

```ts
// lib/interview-client.ts
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
```

```tsx
// components/InterviewPanel.tsx
'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  getInterviewSession,
  startInterviewSession,
  submitInterviewAnswer,
} from '@/lib/interview-client'
import type {
  InterviewAnswerResultView,
  InterviewSessionView,
} from '@/types/interview'
import type { Application } from '@/types'

type Props = {
  app: Application
}

type PanelStatus =
  | 'idle'
  | 'restoring'
  | 'starting'
  | 'active'
  | 'submitting'
  | 'completed'

function getStorageKey(applicationId: string) {
  return `interview-session:${applicationId}`
}

export default function InterviewPanel({ app }: Props) {
  const [status, setStatus] = useState<PanelStatus>('idle')
  const [session, setSession] = useState<InterviewSessionView | null>(null)
  const [answer, setAnswer] = useState('')
  const [error, setError] = useState('')
  const [lastResult, setLastResult] = useState<InterviewAnswerResultView | null>(null)

  useEffect(() => {
    const storedSessionId = window.localStorage.getItem(getStorageKey(app.id))

    if (!storedSessionId) {
      return
    }

    setStatus('restoring')
    getInterviewSession(storedSessionId, app.id)
      .then((nextSession) => {
        setSession(nextSession)
        setStatus(nextSession.completed ? 'completed' : 'active')
      })
      .catch(() => {
        window.localStorage.removeItem(getStorageKey(app.id))
        setStatus('idle')
      })
  }, [app.id])

  async function handleStart() {
    setError('')
    setStatus('starting')

    try {
      const nextSession = await startInterviewSession(app.id)
      setSession(nextSession)
      window.localStorage.setItem(getStorageKey(app.id), nextSession.sessionId)
      setStatus(nextSession.completed ? 'completed' : 'active')
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : '模拟面试暂不可用')
      setStatus('idle')
    }
  }

  async function handleSubmit() {
    if (!session) {
      return
    }

    if (!answer.trim()) {
      setError('请先填写回答内容。')
      return
    }

    setError('')
    setStatus('submitting')

    try {
      const result = await submitInterviewAnswer({
        sessionId: session.sessionId,
        applicationId: app.id,
        answer: answer.trim(),
      })

      setLastResult(result)
      setAnswer('')

      if (result.decision === 'session_completed') {
        window.localStorage.removeItem(getStorageKey(app.id))
        setStatus('completed')
        setSession((current) =>
          current
            ? {
                ...current,
                completed: true,
                currentQuestion: null,
                sessionSummary: result.sessionSummary,
                progress: result.progress,
              }
            : current,
        )
        return
      }

      setSession((current) =>
        current
          ? {
              ...current,
              currentQuestion: result.nextQuestion,
              progress: result.progress,
            }
          : current,
      )
      setStatus('active')
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '提交失败，请重试')
      setStatus('active')
    }
  }

  return (
    <section className="mt-8 rounded-[1.75rem] border border-slate-200/70 bg-[var(--card)] p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
      <h2 className="text-base font-semibold text-slate-900">模拟面试</h2>
      <p className="mt-1 text-sm text-slate-500">
        基于当前投递的公司与岗位发起一轮模拟面试。
      </p>

      {(status === 'idle' || status === 'starting') && !session ? (
        <div className="mt-5 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 text-sm text-slate-600">
            <p>公司：{app.company_name ?? '未填写'}</p>
            <p className="mt-1">岗位：{app.job_title ?? '未填写'}</p>
            <p className="mt-1">题量：3</p>
          </div>
          <Button onClick={() => void handleStart()} disabled={status === 'starting'}>
            {status === 'starting' ? '启动中...' : '开始模拟面试'}
          </Button>
        </div>
      ) : null}

      {status === 'restoring' ? (
        <p className="mt-5 text-sm text-slate-500">正在恢复上次模拟面试...</p>
      ) : null}

      {session && (status === 'active' || status === 'submitting') ? (
        <div className="mt-5 space-y-4">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            <p>已回答 {session.progress.answeredCount} / {session.progress.totalQuestions}</p>
            <p className="mt-1">
              聚焦主题：
              {Array.isArray(session.researchSummary?.topics)
                ? (session.researchSummary.topics as string[]).join(' / ')
                : '暂无'}
            </p>
          </div>

          {session.currentQuestion ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-slate-500">
                  {session.currentQuestion.questionKind === 'follow_up' ? '追问' : '主问题'}
                </span>
                <span className="text-xs text-slate-500">
                  {session.currentQuestion.evidenceLabel}
                </span>
              </div>
              <p className="mt-3 text-sm font-medium text-slate-900">
                {session.currentQuestion.question}
              </p>
            </div>
          ) : null}

          <div className="space-y-3">
            <label htmlFor="interview-answer" className="text-sm font-medium text-slate-800">
              你的回答
            </label>
            <Textarea
              id="interview-answer"
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              rows={6}
            />
            <Button onClick={() => void handleSubmit()} disabled={status === 'submitting'}>
              {status === 'submitting' ? '提交中...' : '提交当前回答'}
            </Button>
          </div>

          {lastResult ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <p>得分 {lastResult.evaluation.score}</p>
              <p className="mt-1">{lastResult.evaluation.shortFeedback}</p>
            </div>
          ) : null}
        </div>
      ) : null}

      {status === 'completed' && session ? (
        <div className="mt-5 space-y-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
          <p className="font-medium text-slate-900">
            平均分 {session.sessionSummary?.averageScore ?? lastResult?.sessionSummary?.averageScore ?? 0}
          </p>
          <p>
            题目主题：
            {(session.sessionSummary?.topics ?? []).join(' / ') || '暂无'}
          </p>
          <p>
            记忆分类：
            {lastResult?.memoryUpdate?.classification ?? 'unknown'}
          </p>
          {lastResult?.remarkSync?.message ? <p>{lastResult.remarkSync.message}</p> : null}
        </div>
      ) : null}

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
    </section>
  )
}
```

- [ ] **Step 4: Run the panel test again**

Run: `npx vitest run tests/unit/interview-panel.test.tsx`

Expected: PASS with start, restore, and complete flows covered.

- [ ] **Step 5: Commit the panel implementation and remove the old draft test**

```bash
git rm tests/unit/interview-agent-panel.test.tsx
git add components/InterviewPanel.tsx lib/interview-client.ts tests/unit/interview-panel.test.tsx
git commit -m "feat: add interview panel"
```

### Task 5: Integrate the Panel into the Detail Sidebar and Remove the Old Action Draft

**Files:**
- Modify: `components/ApplicationDetailClient.tsx`
- Modify: `tests/unit/application-detail-client.test.tsx`
- Modify: `README.md`
- Delete: `tests/unit/interview-agent-actions.test.ts`

- [ ] **Step 1: Extend the detail-client test to require the new panel**

```tsx
test('renders the interview panel inside the fixed sidebar without regressing existing actions', () => {
  render(<ApplicationDetailClient app={application} events={events} />)

  const sidebar = screen.getByTestId('detail-action-sidebar')

  expect(within(sidebar).getByText('模拟面试')).toBeInTheDocument()
  expect(
    within(sidebar).getByRole('button', { name: '开始模拟面试' }),
  ).toBeInTheDocument()
  expect(
    within(sidebar).getByRole('button', { name: '更新状态' }),
  ).toBeInTheDocument()
  expect(
    within(sidebar).getByRole('button', { name: '删除这条投递' }),
  ).toBeInTheDocument()
})
```

- [ ] **Step 2: Run the updated detail-client test and confirm it fails**

Run: `npx vitest run tests/unit/application-detail-client.test.tsx`

Expected: FAIL because [`components/ApplicationDetailClient.tsx`](/mnt/e/JavaProject/Resume-Submission-Assistant/components/ApplicationDetailClient.tsx) does not render the interview panel yet.

- [ ] **Step 3: Mount the panel in the sidebar and document the new env var**

```tsx
// components/ApplicationDetailClient.tsx
import InterviewPanel from './InterviewPanel'

export default function ApplicationDetailClient({ app, events }: Props) {
  // existing state and handlers stay unchanged

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <Timeline
        events={items}
        selectedEventId={selectedEventId}
        onSelect={handleTimelineSelect}
      />

      <TimelineEventDialog
        event={selectedEvent}
        open={dialogOpen && !!selectedEvent}
        value={remark}
        error={remarkError}
        isPending={isRemarkPending}
        onChangeAction={setRemark}
        onSaveAction={() => {
          void handleRemarkSubmit()
        }}
        onCloseAction={handleDialogClose}
      />

      <section
        data-testid="detail-action-sidebar"
        className="rounded-[1.75rem] border border-slate-200/70 bg-[var(--card)] p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)]"
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">跟进操作</h2>
            <p className="mt-1 text-sm text-slate-500">
              更新当前进展，或在确认后删除这条记录。
            </p>
          </div>
          <StatusBadge status={currentStatus} />
        </div>

        {/* keep the existing status and delete controls */}

        <InterviewPanel app={app} />
      </section>
    </div>
  )
}
```

```md
<!-- README.md -->
### 2. 配置环境变量

在项目根目录创建 `.env.local`，新增一项：

```bash
JOBAGENT_BASE_URL=http://127.0.0.1:18090
```

### 生产环境变量

在 Vercel 生产环境变量里新增一项：

```bash
JOBAGENT_BASE_URL=https://your-jobagent-service.example.com
```
```

- [ ] **Step 4: Run the focused interview suite, then the full test suite**

Run: `npx vitest run tests/unit/interview-start-route.test.ts tests/unit/interview-session-routes.test.ts tests/unit/interview-panel.test.tsx tests/unit/application-detail-client.test.tsx`

Expected: PASS with the interview integration path fully covered.

Run: `npx vitest run`

Expected: PASS across the existing suite with no regressions.

- [ ] **Step 5: Commit the integration, docs, and stale-test cleanup**

```bash
git rm tests/unit/interview-agent-actions.test.ts
git add README.md components/ApplicationDetailClient.tsx tests/unit/application-detail-client.test.tsx
git commit -m "feat: integrate interview panel into application detail"
```
