import React, { useState } from 'react'
import {
  FileText,
  Building,
  User,
  Phone,
  MapPin,
  ClipboardList,
  X,
  Save,
  Copy,
  CheckCircle,
  Bot
} from 'lucide-react'
import HubSpotContactSearch from './HubSpotContactSearch'
import { HubSpotContact, HubSpotService } from '../services/hubspotService'
import { UseFormRegister, FieldErrors } from 'react-hook-form'
import { toTitleCase } from '../lib/titleCase'

export interface ProjectDetailsData {
  projectName: string
  companyName: string
  contactName: string
  siteAddress: string
  sitePhone: string
  shopLocation: string
  scopeOfWork: string
  email?: string
}

interface ProjectDetailsProps {
  data: ProjectDetailsData
  onChange: (field: keyof ProjectDetailsData, value: string) => void
  onSelectContact: (contact: HubSpotContact) => void
  onCopySiteAddress: () => boolean
  onOpenScopeExtractor: () => void
  canUseAI: boolean
  register: UseFormRegister<ProjectDetailsData>
  errors: FieldErrors<ProjectDetailsData>
}

const ProjectDetails: React.FC<ProjectDetailsProps> = ({
  data,
  onChange,
  onSelectContact,
  onCopySiteAddress,
  onOpenScopeExtractor,
  canUseAI,
  register,
  errors
}) => {
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null)
  const [pendingUpdates, setPendingUpdates] = useState<Record<string, unknown>>({})
  const [updateMessage, setUpdateMessage] = useState<string | null>(null)
  const [updateError, setUpdateError] = useState<string | null>(null)
  const [projectNameCopied, setProjectNameCopied] = useState(false)
  const [siteAddressCopied, setSiteAddressCopied] = useState(false)
  const [companyNameCopied, setCompanyNameCopied] = useState(false)
  const inputClasses =
    'px-4 py-2.5 rounded-xl border border-accent/25 bg-surface-highlight/70 text-white placeholder:text-slate-400 shadow-[0_12px_28px_rgba(8,16,28,0.45)] transition focus:border-accent focus:ring-2 focus:ring-accent/40'
  const iconButtonClasses =
    'p-2 rounded-xl border border-accent/30 bg-accent-soft/40 text-accent transition hover:border-accent hover:bg-accent/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50'
  const handleFieldChange = (field: keyof ProjectDetailsData, rawValue: string) => {
    const value =
      field === 'projectName' || field === 'contactName'
        ? toTitleCase(rawValue)
        : rawValue
    onChange(field, value)
    if (selectedContactId) {
      setPendingUpdates(prev => {
        const payload = { ...prev }
        if (field === 'contactName') {
          const [firstName, ...rest] = value.split(' ')
          payload.firstName = firstName
          payload.lastName = rest.join(' ')
        } else if (field === 'sitePhone') {
          payload.phone = value
        } else if (field === 'email') {
          payload.email = value
        } else if (field === 'siteAddress') {
          payload.address = value
        }
        return payload
      })
    }
  }

  const handleSaveContact = async () => {
    if (selectedContactId && Object.keys(pendingUpdates).length > 0) {
      try {
        await HubSpotService.updateContact(selectedContactId, pendingUpdates as Partial<HubSpotContact>)
        setUpdateMessage('Contact updated')
        setUpdateError(null)
        setPendingUpdates({})
      } catch (err) {
        setUpdateError(err instanceof Error ? err.message : 'Update failed')
        setUpdateMessage(null)
      }
    }
  }

  const handleSelectContact = (contact: HubSpotContact) => {
    setSelectedContactId(contact.id)
    setPendingUpdates({})
    onSelectContact(contact)
  }

  const handleCopyProjectName = async () => {
    try {
      await navigator.clipboard.writeText(data.projectName)
      setProjectNameCopied(true)
      setTimeout(() => setProjectNameCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy project name', err)
    }
  }

  const handleCopyCompanyName = async () => {
    try {
      await navigator.clipboard.writeText(data.companyName)
      setCompanyNameCopied(true)
      setTimeout(() => setCompanyNameCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy company name', err)
    }
  }

  const handleCopySiteAddress = () => {
    try {
      const copied = onCopySiteAddress()
      if (copied) {
        setSiteAddressCopied(true)
        setTimeout(() => setSiteAddressCopied(false), 2000)
      }
    } catch (err) {
      console.error('Failed to copy site address', err)
    }
  }

  const clearSection = () => {
    ;(['projectName', 'companyName', 'contactName', 'siteAddress', 'sitePhone', 'scopeOfWork', 'email'] as (keyof ProjectDetailsData)[]).forEach(field => {
      onChange(field, '')
    })
    onChange('shopLocation', 'Shop')
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-xl font-semibold text-white">Project Details</h3>
        <button
          type="button"
          onClick={clearSection}
          className="inline-flex items-center gap-2 rounded-xl border border-accent/30 bg-accent-soft/40 px-3 py-2 text-sm font-medium text-accent transition hover:border-accent hover:bg-accent/10 hover:text-white"
        >
          <X className="h-4 w-4" />
          Clear Section
        </button>
      </div>

      <HubSpotContactSearch onSelectContact={handleSelectContact} />

      {selectedContactId && (
        <button
          type="button"
          onClick={handleSaveContact}
          disabled={Object.keys(pendingUpdates).length === 0}
          className="mb-2 inline-flex items-center gap-2 rounded-xl bg-accent px-3 py-2 text-sm font-semibold text-black shadow-sm transition hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          Save to HubSpot
        </button>
      )}

      {updateMessage && <p className="text-sm text-green-400">{updateMessage}</p>}
      {updateError && <p className="text-sm text-red-400">{updateError}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            <FileText className="w-4 h-4 inline mr-1" />
            Project Name
          </label>
          {(() => {
            const field = register('projectName')
            return (
              <>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={data.projectName}
                    onChange={(e) => {
                      const formattedValue = toTitleCase(e.target.value)
                      e.target.value = formattedValue
                      field.onChange(e)
                      handleFieldChange('projectName', formattedValue)
                    }}
                    className={`flex-1 ${inputClasses}`}
                    placeholder="Enter project name"
                  />
                  <button
                    type="button"
                    onClick={handleCopyProjectName}
                    disabled={!data.projectName}
                    aria-label="Copy project name"
                    className={iconButtonClasses}
                  >
                    {projectNameCopied ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.projectName && (
                  <p className="text-red-500 text-xs mt-1">{String(errors.projectName.message)}</p>
                )}
              </>
            )
          })()}
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">
            <Building className="w-4 h-4 inline mr-1" />
            Company Name
          </label>
          {(() => {
            const field = register('companyName')
            return (
              <>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={data.companyName}
                    onChange={(e) => {
                      field.onChange(e)
                      handleFieldChange('companyName', e.target.value)
                    }}
                    className={`flex-1 ${inputClasses}`}
                    placeholder="Enter company name"
                  />
                  <button
                    type="button"
                    onClick={handleCopyCompanyName}
                    disabled={!data.companyName}
                    aria-label="Copy company name"
                    className={iconButtonClasses}
                  >
                    {companyNameCopied ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.companyName && (
                  <p className="text-red-500 text-xs mt-1">{String(errors.companyName.message)}</p>
                )}
              </>
            )
          })()}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            <User className="w-4 h-4 inline mr-1" />
            Site Contact
          </label>
          {(() => {
            const field = register('contactName')
            return (
              <>
                <input
                  type="text"
                  value={data.contactName}
                  onChange={(e) => {
                    const formattedValue = toTitleCase(e.target.value)
                    e.target.value = formattedValue
                    field.onChange(e)
                    handleFieldChange('contactName', formattedValue)
                  }}
                  className={`w-full ${inputClasses}`}
                  placeholder="Enter site contact"
                />
                {errors.contactName && (
                  <p className="text-red-500 text-xs mt-1">{String(errors.contactName.message)}</p>
                )}
              </>
            )
          })()}
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">
            <Phone className="w-4 h-4 inline mr-1" />
            Site Phone
          </label>
          {(() => {
            const field = register('sitePhone')
            return (
              <>
                <input
                  type="tel"
                  value={data.sitePhone}
                  onChange={(e) => {
                    field.onChange(e)
                    handleFieldChange('sitePhone', e.target.value)
                  }}
                  className={`w-full ${inputClasses}`}
                  placeholder="Enter site phone"
                />
                {errors.sitePhone && (
                  <p className="text-red-500 text-xs mt-1">{String(errors.sitePhone.message)}</p>
                )}
              </>
            )
          })()}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-white mb-2">
          <MapPin className="w-4 h-4 inline mr-1" />
          Site Address
        </label>
        {(() => {
          const field = register('siteAddress')
          return (
            <>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={data.siteAddress}
                  onChange={(e) => {
                    field.onChange(e)
                    handleFieldChange('siteAddress', e.target.value)
                  }}
                  className={`flex-1 min-w-0 ${inputClasses}`}
                  placeholder="Enter site address"
                />
                <button
                  type="button"
                  onClick={handleCopySiteAddress}
                  disabled={!data.siteAddress}
                  className={`inline-flex items-center gap-2 ${iconButtonClasses}`}
                  aria-label="Copy site address to pickup location"
                >
                  {siteAddressCopied ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy to Pickup
                    </>
                  )}
                </button>
              </div>
              {errors.siteAddress && (
                <p className="text-red-500 text-xs mt-1">{String(errors.siteAddress.message)}</p>
              )}
            </>
          )
        })()}
      </div>

      <div>
        <label className="block text-sm font-medium text-white mb-2">
          <MapPin className="w-4 h-4 inline mr-1" />
          Shop Location
        </label>
        {(() => {
          const field = register('shopLocation')
          return (
            <>
              <select
                value={data.shopLocation}
                onChange={(e) => {
                  field.onChange(e)
                  handleFieldChange('shopLocation', e.target.value)
                }}
                className={`w-full ${inputClasses}`}
              >
                <option value="Shop">Shop</option>
                <option value="Mukilteo">Mukilteo</option>
                <option value="Fife">Fife</option>
              </select>
              {errors.shopLocation && (
                <p className="text-red-500 text-xs mt-1">{String(errors.shopLocation.message)}</p>
              )}
            </>
          )
        })()}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-white">
            <ClipboardList className="w-4 h-4 inline mr-1" />
            Scope of Work
          </label>
          <button
            type="button"
            onClick={onOpenScopeExtractor}
            disabled={!canUseAI}
            className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition ${
              canUseAI
                ? 'border-accent/40 bg-accent-soft/40 text-accent hover:border-accent hover:bg-accent/15 hover:text-white'
                : 'border-accent/15 bg-surface/40 text-slate-500/80 cursor-not-allowed'
            }`}
          >
            <Bot className="h-3.5 w-3.5" />
            Extract Scope {canUseAI ? 'Ready' : 'Locked'}
          </button>
        </div>
        {(() => {
          const field = register('scopeOfWork')
          return (
            <>
              <textarea
                value={data.scopeOfWork}
                onChange={(e) => {
                  field.onChange(e)
                  handleFieldChange('scopeOfWork', e.target.value)
                }}
                rows={4}
                className={`w-full resize-y min-h-[120px] ${inputClasses}`}
                placeholder="Describe scope of work"
              />
              {errors.scopeOfWork && (
                <p className="text-red-500 text-xs mt-1">{String(errors.scopeOfWork.message)}</p>
              )}
            </>
          )
        })()}
      </div>
    </div>
  )
}

export default ProjectDetails

