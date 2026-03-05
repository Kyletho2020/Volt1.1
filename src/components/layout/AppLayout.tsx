import React from 'react'
import type { ReactNode } from 'react'

interface AppLayoutProps {
  header: ReactNode
  children: ReactNode
}

const AppLayout: React.FC<AppLayoutProps> = ({ header, children }) => {
  return (
    <div className="min-h-screen bg-background text-white">
      {header}
      <main className="mx-auto w-full max-w-[1500px] px-4 pt-24 pb-12 sm:px-6">
        {children}
      </main>
    </div>
  )
}

export default AppLayout
