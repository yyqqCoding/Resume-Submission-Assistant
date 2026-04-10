type PublicEnvSource = Readonly<Record<string, string | undefined>>

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
