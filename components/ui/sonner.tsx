'use client'

import { Toaster } from 'sonner'

export function AppToaster() {
  return (
    <Toaster
      position="top-center"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast:
            'rounded-[calc(var(--radius)+8px)] border border-border bg-white/95 text-card-foreground shadow-xl backdrop-blur-md',
          title: 'text-sm font-semibold',
          description: 'text-sm text-muted-foreground',
          actionButton:
            'rounded-xl bg-primary px-3 py-2 text-primary-foreground hover:bg-primary/90',
          cancelButton: 'rounded-xl bg-accent px-3 py-2 text-accent-foreground',
        },
      }}
    />
  )
}
