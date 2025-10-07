import React, { useState } from 'react'
import { Copy, CheckCircle, Trash2, Plus } from 'lucide-react'

interface ClarificationsSectionProps {
  title: string
  initialItems: string[]
}

interface ClarificationItem {
  text: string
  copied: boolean
}

const ClarificationsSection: React.FC<ClarificationsSectionProps> = ({ title, initialItems }) => {
  const [items, setItems] = useState<ClarificationItem[]>(
    initialItems.map(text => ({ text, copied: false }))
  )

  const handleTextChange = (index: number, value: string) => {
    setItems(prev =>
      prev.map((item, i) =>
        i === index ? { ...item, text: value, copied: false } : item
      )
    )
  }

  const handleCopy = async (index: number) => {
    try {
      await navigator.clipboard.writeText(items[index].text)
      setItems(prev =>
        prev.map((item, i) => (i === index ? { ...item, copied: true } : item))
      )
    } catch (err) {
      console.error('Failed to copy text', err)
    }
  }

  const handleDelete = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  const handleAdd = () => {
    setItems(prev => [...prev, { text: '', copied: false }])
  }

  return (
    <div className="rounded-3xl border border-accent/15 bg-surface/80 p-6 shadow-[0_30px_100px_rgba(10,18,35,0.55)] backdrop-blur-xl">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-semibold text-white">{title}</h2>
        <button
          onClick={handleAdd}
          className="inline-flex items-center gap-2 rounded-xl bg-accent px-3 py-2 text-sm font-semibold text-black shadow-sm transition hover:bg-green-400"
        >
          <Plus className="h-4 w-4" /> Add clarification
        </button>
      </div>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div
            key={index}
            className="flex flex-col gap-2 rounded-2xl border border-accent/20 bg-surface-highlight/70 p-3 shadow-[0_16px_32px_rgba(10,18,35,0.45)] sm:flex-row sm:items-center sm:gap-3"
          >
            <input
              type="text"
              value={item.text}
              onChange={(e) => handleTextChange(index, e.target.value)}
              className="flex-1 rounded-xl border border-accent/25 bg-surface/80 px-3 py-2 text-sm text-white placeholder:text-slate-400 shadow-[0_10px_28px_rgba(8,16,28,0.45)] focus:border-accent focus:ring-2 focus:ring-accent/40"
              placeholder="Clarification"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy(index)}
                className={`flex items-center justify-center rounded-xl border px-3 py-2 transition ${
                  item.copied
                    ? 'border-accent/60 bg-accent-soft/50 text-accent'
                    : 'border-accent/25 bg-accent-soft/40 text-slate-200 hover:border-accent hover:bg-accent/15 hover:text-white'
                }`}
              >
                {item.copied ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
              <button
                onClick={() => handleDelete(index)}
                className="flex items-center justify-center rounded-xl bg-red-500/90 p-2 text-white transition hover:bg-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ClarificationsSection

