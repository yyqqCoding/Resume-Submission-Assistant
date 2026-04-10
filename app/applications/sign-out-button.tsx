'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SignOutButton() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSignOut() {
    setIsSubmitting(true)
    setErrorMessage('')

    const supabase = createClient()
    const { error } = await supabase.auth.signOut()

    if (error) {
      setErrorMessage('退出失败，请稍后重试')
      setIsSubmitting(false)
      return
    }

    router.push('/login')
    router.refresh()
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleSignOut}
        disabled={isSubmitting}
        className="inline-flex items-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? '退出中...' : '退出登录'}
      </button>

      {errorMessage ? (
        <p className="text-sm text-red-600">{errorMessage}</p>
      ) : null}
    </div>
  )
}
