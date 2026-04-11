import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getPublicEnv } from '@/lib/env'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const loginUrl = new URL('/login', request.url)
  const applicationsUrl = new URL('/applications', request.url)

  if (!code) {
    return NextResponse.redirect(loginUrl)
  }

  const { url, anonKey } = getPublicEnv()
  const response = NextResponse.redirect(applicationsUrl)

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(loginUrl)
  }

  return response
}
