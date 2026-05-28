import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

let _client: ReturnType<typeof createClient> | null = null

function getAnonClient() {
  if (!_client) {
    _client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return _client
}

export async function getUserId(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  try {
    const token = authHeader.slice(7)
    const { data: { user } } = await getAnonClient().auth.getUser(token)
    return user?.id ?? null
  } catch {
    return null
  }
}
