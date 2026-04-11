import type { Metadata } from 'next'
import { AppToaster } from '@/components/ui/sonner'
import './globals.css'

export const metadata: Metadata = {
  title: '简历投递追踪器',
  description: '记录你的投递进度、状态变化和后续动作。',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN">
      <body>
        {children}
        <AppToaster />
      </body>
    </html>
  )
}
