'use client'

import Sidebar from '@/components/sidebar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-zinc-950">
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-x-hidden">
        <div className="pt-14 md:pt-0 p-4 md:p-6 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  )
}
