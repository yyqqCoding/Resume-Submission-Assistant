import Link from 'next/link'
import { CheckSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'

const navItems = [
  { label: '概览', href: '#overview' },
  { label: '功能', href: '#features' },
  { label: '价格', href: '#' },
  { label: '模板', href: '#' },
  { label: '帮助中心', href: '#' },
  { label: '博客', href: '#' },
]

export default function LandingHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-black/5 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-lg bg-[var(--accent)] text-white shadow-sm">
            <CheckSquare className="size-5" strokeWidth={2.5} />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-base font-bold tracking-tight text-foreground">职途清单</span>
            <span className="text-[10px] text-muted-foreground">求职更智能 · 进展不焦虑</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium text-foreground/70 md:flex">
          {navItems.map((item, idx) => (
            <a
              key={item.label}
              href={item.href}
              className={
                idx === 0
                  ? 'relative text-[var(--accent)] after:absolute after:-bottom-2 after:left-1/2 after:h-0.5 after:w-6 after:-translate-x-1/2 after:rounded-full after:bg-[var(--accent)]'
                  : 'transition-colors hover:text-foreground'
              }
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium text-foreground/70 transition-colors hover:text-foreground"
          >
            登录
          </Link>
          <Button asChild size="sm" className="rounded-full px-4">
            <Link href="/login">注册免费试用</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
