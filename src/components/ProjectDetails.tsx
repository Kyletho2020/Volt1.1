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
  Bot,
  Mail
} from 'lucide-react'
import HubSpotContactSearch from './HubSpotContactSearch'
import { HubSpotContact, HubSpotService } from '../services/hubspotService'
import { UseFormRegister, FieldErrors } from 'react-hook-form'
import { toTitleCase } from '../lib/titleCase'
import { Button, IconButton, Toggle } from './ui'

export interface ProjectDetailsData {
  jobNumber: string
  startTime: string
  projectName: string
  companyName: string
  contactName: string
  siteAddress: string
  sitePhone: string
  shopLocation: string
  scopeOfWork: string
  email?: string
  siteContactName?: string
  siteContactPhone?: string
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

const inputCls =
  'w-full rounded-lg border border-surface-overlay bg-surface-raised px-3 py-2 text-sm text-white placeholder-gray-500 transition focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent'

const labelCls = 'block text-xs font-medium uppercase tracking-wide text-gray-400 mb-1'

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
  const [showDifferentSiteContact, setShowDifferentSiteContact] = useState(Boolean(data.siteContactName))
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null)
  const [pendingUpdates, setPendingUpdates] = useState<Record<string, unknown>>({})
  const [updateMessage, setUpdateMessage] = useState<string | null>(null)
  const [updateError, setUpdateError] = useState<string | null>(null)
  const [projectNameCopied, setProjectNameCopied] = useState(false)
  const [siteAddressCopied, setSiteAddressCopied] = useState(false)
  const [companyNameCopied, setCompanyNameCopied] = useState(false)

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
    ;(['jobNumber', 'startTime', 'projectName', 'companyName', 'contactName', 'siteAddress', 'sitePhone', 'scopeOfWork', 'email', 'siteContactName', 'siteContactPhone'] as (keyof ProjectDetailsData)[]).forEach(field => {
      onChange(field, '')
    })
    onChange('shopLocation', 'Shop')
    setShowDifferentSiteContact(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Project Details</h3>
        <Button variant="ghost" size="sm" icon={X} onClick={clearSection}>
          Clear
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Job Number</label>
          {(() => {
            const field = register('jobNumber')
            return (
              <>
                <input
                  type="text"
                  value={data.jobNumber}
                  onChange={(e) => { field.onChange(e); handleFieldChange('jobNumber', e.target.value) }}
                  className={inputCls}
                  placeholder="e.g. 9237-24"
                />
                {errors.jobNumber && <p className="text-red-400 text-xs mt-1">{String(errors.jobNumber.message)}</p>}
              </>
            )
          })()}
        </div>
        <div>
          <label className={labelCls}>Start Time</label>
          {(() => {
            const field = register('startTime')
            return (
              <>
                <input
                  type="text"
                  value={data.startTime}
                  onChange={(e) => { field.onChange(e); handleFieldChange('startTime', e.target.value) }}
                  className={inputCls}
                  placeholder="e.g. 8 am"
                />
                {errors.startTime && <p className="text-red-400 text-xs mt-1">{String(errors.startTime.message)}</p>}
              </>
            )
          })()}
        </div>
      </div>

      <HubSpotContactSearch onSelectContact={handleSelectContact} />

      {selectedContactId && (
        <Button
          variant="primary"
          size="sm"
          icon={Save}
          onClick={handleSaveContact}
          disabled={Object.keys(pendingUpdates).length === 0}
        >
          Save to HubSpot
        </Button>
      )}

      {updateMessage && <p className="text-xs text-accent">{updateMessage}</p>}
      {updateError && <p className="text-xs text-red-400">{updateError}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Project Name</label>
          {(() => {
            const field = register('projectName')
            return (
              <>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={data.projectName}
                    onChange={(e) => {
                      const v = toTitleCase(e.target.value)
                      e.target.value = v
                      field.onChange(e)
                      handleFieldChange('projectName', v)
                    }}
                    className={`flex-1 ${inputCls}`}
                    placeholder="Enter project name"
                  />
                  <IconButton
                    icon={projectNameCopied ? CheckCircle : Copy}
                    onClick={handleCopyProjectName}
                    disabled={!data.projectName}
                    tooltip="Copy project name"
                    variant={projectNameCopied ? 'accent' : 'default'}
                  />
                </div>
                {errors.projectName && <p className="text-red-400 text-xs mt-1">{String(errors.projectName.message)}</p>}
              </>
            )
          })()}
        </div>
        <div>
          <label className={labelCls}>Company Name</label>
          {(() => {
            const field = register('companyName')
            return (
              <>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={data.companyName}
                    onChange={(e) => { field.onChange(e); handleFieldChange('companyName', e.target.value) }}
                    className={`flex-1 ${inputCls}`}
                    placeholder="Enter company name"
                  />
                  <IconButton
                    icon={companyNameCopied ? CheckCircle : Copy}
                    onClick={handleCopyCompanyName}
                    disabled={!data.companyName}
                    tooltip="Copy company name"
                    variant={companyNameCopied ? 'accent' : 'default'}
                  />
                </div>
                {errors.companyName && <p className="text-red-400 text-xs mt-1">{String(errors.companyName.message)}</p>}
              </>
            )
          })()}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Site Contact</label>
          {(() => {
            const field = register('contactName')
            return (
              <>
                <input
                  type="text"
                  value={data.contactName}
                  onChange={(e) => {
                    const v = toTitleCase(e.target.value)
                    e.target.value = v
                    field.onChange(e)
                    handleFieldChange('contactName', v)
                  }}
                  className={inputCls}
                  placeholder="Enter site contact"
                />
                {errors.contactName && <p className="text-red-400 text-xs mt-1">{String(errors.contactName.message)}</p>}
              </>
            )
          })()}
        </div>
        <div>
          <label className={labelCls}>Site Phone</label>
          {(() => {
            const field = register('sitePhone')
            return (
              <>
                <input
                  type="tel"
                  value={data.sitePhone}
                  onChange={(e) => { field.onChange(e); handleFieldChange('sitePhone', e.target.value) }}
                  className={inputCls}
                  placeholder="Enter site phone"
                />
                {errors.sitePhone && <p className="text-red-400 text-xs mt-1">{String(errors.sitePhone.message)}</p>}
              </>
            )
          })()}
        </div>
      </div>

      {/* Different site contact toggle */}
      <div className="rounded-xl border border-surface-overlay/50 bg-surface-raised p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white">Different site contact on-site</p>
            <p className="text-xs text-gray-400">Specify a separate person who will be on-site.</p>
          </div>
          <Toggle
            checked={showDifferentSiteContact}
            onChange={(checked) => {
              setShowDifferentSiteContact(checked)
              if (!checked) {
                onChange('siteContactName', '')
                onChange('siteContactPhone', '')
              }
            }}
          />
        </div>

        {showDifferentSiteContact && (
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Site Contact Name</label>
              <input
                type="text"
                value={data.siteContactName || ''}
                onChange={(e) => onChange('siteContactName', toTitleCase(e.target.value))}
                className={inputCls}
                placeholder="Enter on-site contact name"
              />
            </div>
            <div>
              <label className={labelCls}>Site Contact Phone</label>
              <input
                type="tel"
                value={data.siteContactPhone || ''}
                onChange={(e) => onChange('siteContactPhone', e.target.value)}
                className={inputCls}
                placeholder="Enter on-site contact phone"
              />
            </div>
          </div>
        )}
      </div>

      <div>
        <label className={labelCls}>Contact Email</label>
        {(() => {
          const field = register('email')
          return (
            <>
              <input
                type="email"
                value={data.email || ''}
                onChange={(e) => { field.onChange(e); handleFieldChange('email', e.target.value) }}
                className={inputCls}
                placeholder="name@example.com"
                autoComplete="email"
              />
              {errors.email && <p className="text-red-400 text-xs mt-1">{String(errors.email.message)}</p>}
            </>
          )
        })()}
      </div>

      <div>
        <label className={labelCls}>Site Address</label>
        {(() => {
          const field = register('siteAddress')
          return (
            <>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={data.siteAddress}
                  onChange={(e) => { field.onChange(e); handleFieldChange('siteAddress', e.target.value) }}
                  className={`flex-1 min-w-0 ${inputCls}`}
                  placeholder="Enter site address"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  icon={siteAddressCopied ? CheckCircle : Copy}
                  onClick={handleCopySiteAddress}
                  disabled={!data.siteAddress}
                >
                  {siteAddressCopied ? 'Copied' : 'Copy to Pickup'}
                </Button>
              </div>
              {errors.siteAddress && <p className="text-red-400 text-xs mt-1">{String(errors.siteAddress.message)}</p>}
            </>
          )
        })()}
      </div>

      <div>
        <label className={labelCls}>Shop Location</label>
        {(() => {
          const field = register('shopLocation')
          return (
            <>
              <select
                value={data.shopLocation}
                onChange={(e) => { field.onChange(e); handleFieldChange('shopLocation', e.target.value) }}
                className={inputCls}
              >
                <option value="Shop">Shop</option>
                <option value="Mukilteo">Mukilteo</option>
                <option value="Fife">Fife</option>
              </select>
              {errors.shopLocation && <p className="text-red-400 text-xs mt-1">{String(errors.shopLocation.message)}</p>}
            </>
          )
        })()}
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className={labelCls}>Scope of Work</label>
          <Button
            variant={canUseAI ? 'secondary' : 'ghost'}
            size="sm"
            icon={Bot}
            onClick={onOpenScopeExtractor}
            disabled={!canUseAI}
          >
            Extract Scope {canUseAI ? 'Ready' : 'Locked'}
          </Button>
        </div>
        {(() => {
          const field = register('scopeOfWork')
          return (
            <>
              <textarea
                value={data.scopeOfWork}
                onChange={(e) => { field.onChange(e); handleFieldChange('scopeOfWork', e.target.value) }}
                rows={4}
                className={`${inputCls} resize-y min-h-[120px]`}
                placeholder="Describe scope of work"
              />
              {errors.scopeOfWork && <p className="text-red-400 text-xs mt-1">{String(errors.scopeOfWork.message)}</p>}
            </>
          )
        })()}
      </div>
    </div>
  )
}

export default ProjectDetails
