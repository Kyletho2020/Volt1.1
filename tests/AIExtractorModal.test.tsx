import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import React from 'react'

vi.mock('../src/hooks/useApiKey', () => ({
  useApiKey: () => ({ hasApiKey: true, loading: false, error: null })
}))

vi.mock('../src/services/aiExtractionService', () => ({
  AIExtractionService: { extractProjectInfo: vi.fn() }
}))

import AIExtractorModal from '../src/components/AIExtractorModal'
import { AIExtractionService } from '../src/services/aiExtractionService'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('AIExtractorModal', () => {
  it('returns null when closed', () => {
    const { container } = render(
      <AIExtractorModal isOpen={false} onClose={() => {}} onExtract={() => {}} sessionId="s1" />
    )
    expect(container.firstChild).toBeNull()
  })

  it('shows ready state when open', () => {
    render(
      <AIExtractorModal isOpen={true} onClose={() => {}} onExtract={() => {}} sessionId="s1" />
    )
    expect(screen.getByText('Ready to extract')).toBeInTheDocument()
  })

  it('calls onExtract after successful extraction', async () => {
    ;(AIExtractionService.extractProjectInfo as unknown as vi.Mock).mockResolvedValue({
      success: true,
      equipmentData: { projectName: 'P' },
      logisticsData: { pickupAddress: 'A' }
    })

    const onExtract = vi.fn()
    render(
      <AIExtractorModal isOpen={true} onClose={() => {}} onExtract={onExtract} sessionId="s1" />
    )

    const textarea = screen.getByPlaceholderText(/Paste your email/i)
    fireEvent.change(textarea, { target: { value: 'sample text' } })

    const button = screen.getByRole('button', { name: /Extract Info/i })
    fireEvent.click(button)

    await waitFor(() => {
      expect(AIExtractionService.extractProjectInfo).toHaveBeenCalled()
      expect(onExtract).toHaveBeenCalledWith({ projectName: 'P' }, { pickupAddress: 'A' })
    })
  })
})
