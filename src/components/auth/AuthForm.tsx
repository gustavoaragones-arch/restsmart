'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type AuthMode = 'login' | 'signup'

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: fullName }, emailRedirectTo: `${window.location.origin}/auth/callback` },
      })
      if (error) setError(error.message)
      else setSuccessMessage('Check your email to confirm your account.')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
      else { router.push('/dashboard'); router.refresh() }
    }
    setLoading(false)
  }

  async function handleGoogleAuth() {
    setGoogleLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) { setError(error.message); setGoogleLoading(false) }
  }

  if (successMessage) {
    return (
      <div className="w-full max-w-sm mx-auto text-center">
        <h3 className="text-white font-semibold text-lg mb-2">Check your email</h3>
        <p className="text-slate-400 text-sm">We sent a confirmation link to <span className="text-slate-200">{email}</span>.</p>
        <button onClick={() => { setSuccessMessage(null); setEmail(''); setPassword('') }} className="mt-6 text-sm text-blue-400 hover:text-blue-300">Back to sign in</button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      <button onClick={handleGoogleAuth} disabled={googleLoading || loading}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg border border-slate-700 bg-slate-800/50 hover:bg-slate-800 transition-all text-sm font-medium text-slate-200 disabled:opacity-50 mb-6">
        {googleLoading ? <span className="w-4 h-4 border-2 border-slate-500 border-t-slate-200 rounded-full animate-spin" /> : (
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        )}
        {googleLoading ? 'Connecting...' : 'Continue with Google'}
      </button>
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 h-px bg-slate-800" />
        <span className="text-xs text-slate-600">or</span>
        <div className="flex-1 h-px bg-slate-800" />
      </div>
      <form onSubmit={handleEmailAuth} className="space-y-4">
        {mode === 'signup' && (
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Full name</label>
            <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your name" required
              className="w-full px-4 py-3 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-blue-500 transition-all" />
          </div>
        )}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Email address</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required
            className="w-full px-4 py-3 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-blue-500 transition-all" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={mode === 'signup' ? 'Minimum 8 characters' : 'Your password'} required minLength={8}
            className="w-full px-4 py-3 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-blue-500 transition-all" />
        </div>
        {error && <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20"><p className="text-red-400 text-xs">{error}</p></div>}
        <button type="submit" disabled={loading || googleLoading}
          className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2">
          {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{mode === 'signup' ? 'Creating...' : 'Signing in...'}</> : mode === 'signup' ? 'Create account' : 'Sign in'}
        </button>
      </form>
      <p className="text-center text-xs text-slate-600 mt-6">Your health data is encrypted and never sold.</p>
    </div>
  )
}
