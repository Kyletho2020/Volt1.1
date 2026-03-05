import React, { useState } from 'react'
import { Copy, CheckCircle, Trash2, Plus } from 'lucide-react'
import { Button, IconButton } from './ui'

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
      prev.map((item, i) => i === index ? { ...item, text: value, copied: false } : item)
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
    <div className="rounded-xl border border-surface-overlay/50 bg-surface p-4 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <Button variant="primary" size="sm" icon={Plus} onClick={handleAdd}>
          Add
        </Button>
      </div>
      <div className="space-y-1.5">
        {items.map((item, index) => (
          <div
            key={index}
            className="flex items-center gap-2 rounded-lg border border-surface-overlay/50 bg-surface-raised p-2"
          >
            <input
              type="text"
              value={item.text}
              onChange={(e) => handleTextChange(index, e.target.value)}
              className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none"
              placeholder="Clarification"
            />
            <IconButton
              icon={item.copied ? CheckCircle : Copy}
              onClick={() => handleCopy(index)}
              variant={item.copied ? 'accent' : 'default'}
              size="sm"
            />
            <IconButton
              icon={Trash2}
              onClick={() => handleDelete(index)}
              variant="danger"
              size="sm"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export default ClarificationsSection
