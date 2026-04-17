type PublicEnvSource = Readonly<Record<string, string | undefined>>

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '')
}

export function getPublicEnv(source: PublicEnvSource = process.env) {
  const url = source.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const anonKey = source.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

  if (!url || !anonKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.',
    )
  }

  return { url, anonKey }
}

export function getSiteUrl(source: PublicEnvSource = process.env) {
  const siteUrl = source.NEXT_PUBLIC_SITE_URL?.trim()

  if (!siteUrl) {
    throw new Error('Missing NEXT_PUBLIC_SITE_URL.')
  }

  return trimTrailingSlash(siteUrl)
}

export function getJobAgentBaseUrl(source: PublicEnvSource = process.env) {
  const baseUrl = source.JOBAGENT_BASE_URL?.trim()

  if (!baseUrl) {
    throw new Error('Missing JOBAGENT_BASE_URL.')
  }

  return trimTrailingSlash(baseUrl)
}
