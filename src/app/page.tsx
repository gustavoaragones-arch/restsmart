import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  return Boolean(url && url.startsWith('http'))
}

export default async function Home() {
  if (!isSupabaseConfigured()) redirect('/login')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_complete')
    .eq('id', user.id)
    .single()

  if (!profile?.onboarding_complete) redirect('/onboarding')

  redirect('/dashboard')
}
