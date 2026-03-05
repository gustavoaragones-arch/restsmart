export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div
      className={`animate-spin rounded-full border-2 border-slate-600 border-t-primary ${className ?? 'h-6 w-6'}`}
      role="status"
      aria-label="Loading"
    />
  )
}
