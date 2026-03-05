'use client'

import { useRouter } from 'next/navigation'

interface PremiumGateProps {
  isPremium: boolean
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function PremiumGate({ isPremium, children, fallback }: PremiumGateProps) {
  if (isPremium) return <>{children}</>
  return fallback ? <>{fallback}</> : <LockedCard />
}

function LockedCard() {
  const router = useRouter()
  return (
    <div className="relative rounded-lg border border-slate-700 bg-slate-900 p-6 overflow-hidden">
      <div className="absolute inset-0 backdrop-blur-sm bg-slate-900/80 flex flex-col items-center justify-center z-10 gap-3">
        <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <p className="text-slate-300 text-sm font-medium">Premium feature</p>
        <button
          onClick={() => router.push('/settings?tab=subscription')}
          className="text-xs text-blue-400 hover:text-blue-300 underline"
        >
          Upgrade to unlock
        </button>
      </div>
      <div className="opacity-20 pointer-events-none select-none">
        <div className="h-4 bg-slate-700 rounded w-3/4 mb-2" />
        <div className="h-4 bg-slate-700 rounded w-1/2 mb-2" />
        <div className="h-4 bg-slate-700 rounded w-2/3" />
      </div>
    </div>
  )
}
