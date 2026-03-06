import Link from 'next/link'
import { AuthForm } from '@/components/auth/AuthForm'

export const metadata = {
  title: 'Sign in — RestSmart',
}

export default function LoginPage() {
  return (
    <div className="flex-1 flex flex-col">

      {/* Top wordmark */}
      <div className="px-8 pt-10 pb-0">
        <span className="text-white font-semibold text-lg tracking-tight">RestSmart</span>
      </div>

      {/* Center content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">

        {/* Header */}
        <div className="text-center mb-10 w-full max-w-sm">
          <h1 className="text-2xl font-semibold text-white mb-2">
            Welcome back
          </h1>
          <p className="text-slate-400 text-sm">
            Sign in to check your recovery status.
          </p>
        </div>

        {/* Form */}
        <AuthForm mode="login" />

        {/* Switch to signup */}
        <p className="mt-8 text-sm text-slate-500">
          No account?{' '}
          <Link href="/signup" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
            Create one free
          </Link>
        </p>

      </div>

      {/* Bottom links */}
      <div className="px-6 pb-8 flex items-center justify-center gap-6">
        <a href="#" className="text-xs text-slate-600 hover:text-slate-400 transition-colors">Privacy Policy</a>
        <a href="#" className="text-xs text-slate-600 hover:text-slate-400 transition-colors">Terms of Service</a>
      </div>

    </div>
  )
}
