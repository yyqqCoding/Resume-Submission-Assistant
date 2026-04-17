// @vitest-environment node

import { describe, expect, it } from 'vitest'
import { getJobAgentBaseUrl, getPublicEnv } from '@/lib/env'

describe('getPublicEnv', () => {
  it('returns the required public supabase env values', () => {
    expect(
      getPublicEnv({
        NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
      }),
    ).toEqual({
      url: 'https://example.supabase.co',
      anonKey: 'anon-key',
    })
  })

  it('throws when one of the required values is missing', () => {
    expect(() =>
      getPublicEnv({
        NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      }),
    ).toThrow('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.')
  })

  it('returns the normalized JobAgent base url', () => {
    expect(
      getJobAgentBaseUrl({
        JOBAGENT_BASE_URL: 'http://127.0.0.1:18090/',
      }),
    ).toBe('http://127.0.0.1:18090')
  })

  it('throws when JOBAGENT_BASE_URL is missing', () => {
    expect(() => getJobAgentBaseUrl({})).toThrow('Missing JOBAGENT_BASE_URL.')
  })
})
