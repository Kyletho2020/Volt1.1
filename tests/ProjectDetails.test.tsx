import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import React from 'react'
import ProjectDetails, { ProjectDetailsData } from '../src/components/ProjectDetails'

vi.mock('../src/components/HubSpotContactSearch', () => ({
  default: () => <div />
}))

describe('ProjectDetails copy button', () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) }
    })
  })

  it('copies project name to clipboard', async () => {
    const data: ProjectDetailsData = {
      projectName: 'My Project',
      companyName: '',
      contactName: '',
      quotedContactName: '',
      siteAddress: '',
      sitePhone: '',
      shopLocation: '',
      scopeOfWork: '',
      email: ''
    }

    render(
      <ProjectDetails
        data={data}
        onChange={() => {}}
        onSelectContact={() => {}}
        onCopySiteAddress={() => true}
        onOpenScopeExtractor={() => {}}
        canUseAI={false}
        register={() => ({ onChange: () => {} }) as any}
        errors={{}}
      />
    )

    const button = screen.getByLabelText(/copy project name/i)
    fireEvent.click(button)
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('My Project')
    })
  })

  it('calls onCopySiteAddress when copy to pickup button is clicked', () => {
    const copyHandler = vi.fn().mockReturnValue(true)

    const data: ProjectDetailsData = {
      projectName: '',
      companyName: '',
      contactName: '',
      quotedContactName: '',
      siteAddress: '123 Main St, Portland, OR 97205',
      sitePhone: '',
      shopLocation: '',
      scopeOfWork: '',
      email: ''
    }

    render(
      <ProjectDetails
        data={data}
        onChange={() => {}}
        onSelectContact={() => {}}
        onCopySiteAddress={copyHandler}
        onOpenScopeExtractor={() => {}}
        canUseAI={false}
        register={() => ({ onChange: () => {} }) as any}
        errors={{}}
      />
    )

    const button = screen.getByRole('button', {
      name: /copy site address to pickup location/i
    })
    fireEvent.click(button)

    expect(copyHandler).toHaveBeenCalledTimes(1)
  })
})
