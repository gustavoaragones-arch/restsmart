import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'RestSmart — Recovery Intelligence',
  description: 'Your body builds when you rest. RestSmart calculates the rebuild.',
  keywords: ['recovery', 'fitness', 'rest', 'performance', 'sleep'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-background text-slate-100 antialiased`}>
        {children}
      </body>
    </html>
  )
}
