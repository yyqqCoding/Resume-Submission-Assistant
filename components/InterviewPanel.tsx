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
  const [lastResult, setLastResult] = useState<InterviewAnswerResultView | null>(
    null,
  )

  useEffect(() => {
    const storedSessionId = window.localStorage.getItem(getStorageKey(app.id))

    if (!storedSessionId) {
      return
    }

    setStatus('restoring')
    void getInterviewSession(storedSessionId, app.id)
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

  const topics = Array.isArray(session?.researchSummary?.topics)
    ? (session?.researchSummary.topics as string[])
    : []

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
            <p>
              已回答 {session.progress.answeredCount} / {session.progress.totalQuestions}
            </p>
            <p className="mt-1">聚焦主题：{topics.join(' / ') || '暂无'}</p>
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
          <p>题目主题：{(session.sessionSummary?.topics ?? []).join(' / ') || '暂无'}</p>
          <p>记忆分类：{lastResult?.memoryUpdate?.classification ?? 'unknown'}</p>
          {lastResult?.remarkSync?.message ? <p>{lastResult.remarkSync.message}</p> : null}
        </div>
      ) : null}

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
    </section>
  )
}
