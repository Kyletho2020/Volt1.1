import { useState } from 'react'
import type { EquipmentData, LogisticsData } from '../types'
import { generateEmailTemplate, generateScopeTemplate } from '../components/PreviewTemplates'

type TemplateType = 'email' | 'scope' | 'logistics'

export function useTemplates(equipmentData: EquipmentData, logisticsData: LogisticsData) {
  const [copiedTemplate, setCopiedTemplate] = useState<TemplateType | null>(null)

  const emailTemplate = generateEmailTemplate(
    equipmentData,
    logisticsData,
    equipmentData.equipmentRequirements
  )

  const scopeTemplate = generateScopeTemplate(
    equipmentData,
    logisticsData,
    equipmentData.equipmentRequirements
  )

  const copyToClipboard = async (text: string, templateType: TemplateType) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedTemplate(templateType)
      setTimeout(() => setCopiedTemplate(null), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const launchEmailDraft = () => {
    if (typeof window === 'undefined') return

    const recipient = equipmentData.email?.trim() || ''
    const [subjectLine, ...bodyLines] = emailTemplate.split('\n')
    const subject = subjectLine?.trim() || 'Quote Details'
    const body = bodyLines.join('\n').replace(/^\n+/, '')

    const queryParts = [
      subject ? `subject=${encodeURIComponent(subject)}` : '',
      body ? `body=${encodeURIComponent(body)}` : '',
    ].filter(Boolean)

    const mailtoLink = `mailto:${recipient}${queryParts.length ? `?${queryParts.join('&')}` : ''}`
    window.location.href = mailtoLink
  }

  return {
    copiedTemplate,
    emailTemplate,
    scopeTemplate,
    copyToClipboard,
    launchEmailDraft,
  }
}
