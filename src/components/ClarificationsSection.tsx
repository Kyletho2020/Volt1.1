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
    <div className="bg-gray-900 rounded-lg border-2 border-accent p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-white">{title}</h2>
        <button
          onClick={handleAdd}
          className="flex items-center px-3 py-1 bg-accent text-black rounded-lg hover:bg-green-400 transition-colors"
        >
          <Plus className="w-4 h-4 mr-1" /> Add
        </button>
      </div>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              type="text"
              value={item.text}
              onChange={(e) => handleTextChange(index, e.target.value)}
              className="flex-1 px-3 py-2 bg-black border border-accent rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent text-white text-sm"
              placeholder="Clarification"
            />
            <button
              onClick={() => handleCopy(index)}
              className="p-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors border border-accent"
            >
              {item.copied ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={() => handleDelete(index)}
              className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ClarificationsSection

