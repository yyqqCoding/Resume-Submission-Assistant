import { cn } from '@/lib/utils'

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        'animate-pulse rounded-[calc(var(--radius)+2px)] bg-white/70 shadow-[inset_0_0_0_1px_rgba(15,23,42,0.06)]',
        className,
      )}
      {...props}
    />
  )
}

export { Skeleton }
