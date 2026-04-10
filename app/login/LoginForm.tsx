'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type AuthResult = {
  error: {
    message: string
  } | null
}

type AuthClient = {
  auth: {
    signUp: (credentials: {
      email: string
      password: string
    }) => Promise<AuthResult>
    signInWithPassword: (credentials: {
      email: string
      password: string
    }) => Promise<AuthResult>
  }
}

type LoginFormProps = {
  clientFactory?: () => AuthClient
  navigate?: (href: string) => void
}

type MessageState = {
  text: string
  type: 'error' | 'success'
}

const SIGN_UP_SUCCESS_MESSAGE = '注册成功，请查收验证邮件'

export default function LoginForm({
  clientFactory = createClient,
  navigate,
}: LoginFormProps) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<MessageState | null>(null)

  const goTo =
    navigate ??
    ((href: string) => {
      router.push(href)
      router.refresh()
    })

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const normalizedEmail = email.trim()

    if (!normalizedEmail) {
      setMessage({ text: '请输入邮箱地址', type: 'error' })
      return
    }

    if (!password) {
      setMessage({ text: '请输入密码', type: 'error' })
      return
    }

    setIsSubmitting(true)
    setMessage(null)

    try {
      const supabase = clientFactory()

      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
        })

        if (error) {
          setMessage({ text: error.message, type: 'error' })
          return
        }

        setPassword('')
        setMessage({ text: SIGN_UP_SUCCESS_MESSAGE, type: 'success' })
        return
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      })

      if (error) {
        setMessage({ text: '邮箱或密码错误', type: 'error' })
        return
      }

      goTo('/applications')
    } catch {
      setMessage({ text: '网络异常，请稍后重试', type: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700" htmlFor="email">
          邮箱
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-700"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700" htmlFor="password">
          密码
        </label>
        <input
          id="password"
          type="password"
          autoComplete={isSignUp ? 'new-password' : 'current-password'}
          placeholder="请输入密码"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-700"
        />
      </div>

      {message ? (
        <p
          className={`rounded-2xl px-4 py-3 text-sm ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800'
              : 'bg-red-50 text-red-600'
          }`}
        >
          {message.text}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-2xl bg-emerald-800 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? '处理中...' : isSignUp ? '注册账号' : '登录'}
      </button>

      <div className="flex items-center justify-between gap-3 text-sm text-slate-500">
        <span>{isSignUp ? '已有账号？' : '没有账号？'}</span>
        <button
          type="button"
          onClick={() => {
            setIsSignUp((value) => !value)
            setMessage(null)
          }}
          className="font-medium text-emerald-800 transition hover:text-emerald-700"
        >
          {isSignUp ? '去登录' : '去注册'}
        </button>
      </div>
    </form>
  )
}
