'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
      options?: {
        emailRedirectTo?: string
      }
    }) => Promise<AuthResult>
    signInWithPassword: (credentials: {
      email: string
      password: string
    }) => Promise<AuthResult>
  }
}

type LoginFormProps = {
  siteUrl: string
  clientFactoryAction?: () => AuthClient
  navigateAction?: (href: string) => void
}

type MessageState = {
  text: string
  type: 'error'
}

const SIGN_UP_CONFIRMATION_MESSAGE =
  '注册确认邮件已发送至您的邮箱，请点击邮件内的确认注册按钮'

export default function LoginForm({
  siteUrl,
  clientFactoryAction = createClient,
  navigateAction,
}: LoginFormProps) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false)
  const [message, setMessage] = useState<MessageState | null>(null)

  const goTo =
    navigateAction ??
    ((href: string) => {
      router.push(href)
      router.refresh()
    })

  const controlsDisabled = isSubmitting || isConfirmationOpen
  const submitLabel = isSubmitting
    ? isSignUp
      ? '注册中...'
      : '登录中...'
    : isSignUp
      ? '注册账号'
      : '登录'

  function resetPasswordFields() {
    setPassword('')
    setConfirmPassword('')
  }

  function handleModeSwitch() {
    setIsSignUp((value) => !value)
    resetPasswordFields()
    setMessage(null)
  }

  function handleRegistrationAcknowledged() {
    setIsConfirmationOpen(false)
    setIsSignUp(false)
    resetPasswordFields()
    setMessage(null)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const normalizedEmail = email.trim()

    if (!normalizedEmail) {
      setMessage({ text: '请输入邮箱地址', type: 'error' })
      return
    }

    if (isSignUp) {
      if (!password) {
        setMessage({ text: '请输入初始密码', type: 'error' })
        return
      }

      if (!confirmPassword) {
        setMessage({ text: '请再次输入密码', type: 'error' })
        return
      }

      if (password !== confirmPassword) {
        setMessage({ text: '请确认两次输入的密码一致', type: 'error' })
        return
      }
    } else if (!password) {
      setMessage({ text: '请输入密码', type: 'error' })
      return
    }

    setIsSubmitting(true)
    setMessage(null)

    try {
      const supabase = clientFactoryAction()

      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            emailRedirectTo: `${siteUrl}/auth/callback`,
          },
        })

        if (error) {
          setMessage({ text: error.message, type: 'error' })
          return
        }

        resetPasswordFields()
        setIsConfirmationOpen(true)
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
        <Label htmlFor="email">邮箱</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">{isSignUp ? '初始密码' : '密码'}</Label>
        <Input
          id="password"
          type="password"
          disabled={controlsDisabled}
          autoComplete={isSignUp ? 'new-password' : 'current-password'}
          placeholder={isSignUp ? '请设置初始密码' : '请输入密码'}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full"
        />
      </div>

      {isSignUp ? (
        <div className="space-y-2">
          <Label htmlFor="confirm-password">确认密码</Label>
          <Input
            id="confirm-password"
            type="password"
            disabled={controlsDisabled}
            autoComplete="new-password"
            placeholder="请再次输入密码"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="w-full"
          />
        </div>
      ) : null}

      {message ? (
        <p
          role="alert"
          aria-live="assertive"
          className="rounded-[calc(var(--radius)+2px)] bg-red-50 px-4 py-3 text-sm text-red-600"
        >
          {message.text}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={controlsDisabled}
        className="w-full"
      >
        {submitLabel}
      </Button>

      <div className="flex items-center justify-between gap-3 text-sm text-slate-500">
        <span>{isSignUp ? '已有账号？' : '没有账号？'}</span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={controlsDisabled}
          onClick={handleModeSwitch}
          className="h-auto px-0 text-emerald-800 hover:bg-transparent hover:text-emerald-700"
        >
          {isSignUp ? '去登录' : '去注册'}
        </Button>
      </div>

      <Dialog
        open={isConfirmationOpen}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            handleRegistrationAcknowledged()
          }
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>完成邮箱确认</DialogTitle>
            <DialogDescription>
              {SIGN_UP_CONFIRMATION_MESSAGE}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              onClick={handleRegistrationAcknowledged}
              className="rounded-full"
            >
              我知道了，去登录
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  )
}
