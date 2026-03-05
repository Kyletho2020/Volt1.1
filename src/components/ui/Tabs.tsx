import React from 'react'
import { motion } from 'framer-motion'

interface Tab {
  key: string
  label: string
}

interface TabsProps {
  tabs: Tab[]
  activeTab: string
  onChange: (key: string) => void
  className?: string
}

const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, className = '' }) => {
  return (
    <div className={`inline-flex items-center gap-1 rounded-lg bg-white/[0.05] backdrop-blur-sm border border-white/[0.08] p-1 ${className}`}>
      {tabs.map(tab => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onChange(tab.key)}
          className={`relative rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
            activeTab === tab.key
              ? 'text-white'
              : 'text-gray-400 hover:text-white/80'
          }`}
          aria-pressed={activeTab === tab.key}
        >
          {activeTab === tab.key && (
            <motion.div
              layoutId="activeTab"
              className="absolute inset-0 rounded-md bg-accent shadow-sm"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10">{tab.label}</span>
        </button>
      ))}
    </div>
  )
}

export default Tabs
