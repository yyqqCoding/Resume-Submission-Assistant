'use client'

import { useRouter } from 'next/navigation'
import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
  className?: string
}

export default function BackToApplicationsButton({
  children,
  className,
}: Props) {
  const router = useRouter()

  function handleClick() {
    if (window.history.length > 1) {
      router.back()
      return
    }

    router.push('/applications')
  }

  return (
    <button type="button" onClick={handleClick} className={className}>
      {children}
    </button>
  )
}
