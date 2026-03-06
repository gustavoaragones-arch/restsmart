import Link from 'next/link'
import { AuthForm } from '@/components/auth/AuthForm'

export const metadata = {
  title: 'Create account — RestSmart',
}

export default function SignupPage() {
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
            Your body builds when you rest.
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            RestSmart calculates your recovery so you know exactly when to train and when to rest.
          </p>
        </div>

        {/* Value props — 3 lines */}
        <div className="w-full max-w-sm mb-8 space-y-2.5">
          {[
            'Daily recovery score based on your biology',
            'Muscle-by-muscle breakdown after every workout',
            'Sleep debt tracking and tonight\'s sleep target',
          ].map((item) => (
            <div key={item} className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
              <p className="text-slate-300 text-sm">{item}</p>
            </div>
          ))}
        </div>

        {/* Form */}
        <AuthForm mode="signup" />

        {/* Switch to login */}
        <p className="mt-8 text-sm text-slate-500">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
            Sign in
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
