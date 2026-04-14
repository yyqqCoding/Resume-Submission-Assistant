import { NextResponse, type NextRequest } from 'next/server'
import { getApplicationsOverviewPage } from '@/lib/applications-overview-server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }

  const overview = await getApplicationsOverviewPage(supabase, user.id, {
    status: request.nextUrl.searchParams.get('status'),
    page: request.nextUrl.searchParams.get('page'),
  })

  return NextResponse.json(overview, {
    headers: {
      'Cache-Control': 'no-store',
    },
  })
}
