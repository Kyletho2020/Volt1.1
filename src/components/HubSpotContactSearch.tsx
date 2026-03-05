import React, { useState } from 'react'
import { Search, Building, User, Phone, Mail, MapPin } from 'lucide-react'
import { HubSpotService, HubSpotContact } from '../services/hubspotService'
import { Button } from './ui'

interface HubSpotContactSearchProps {
  onSelectContact: (contact: HubSpotContact) => void
}

const HubSpotContactSearch: React.FC<HubSpotContactSearchProps> = ({ onSelectContact }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState<HubSpotContact[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const searchContacts = async (term: string) => {
    if (!term.trim()) { setResults([]); return }
    setLoading(true)
    setError(null)
    try {
      const contacts = await HubSpotService.searchContactsByName(term, true)
      setResults(contacts)
    } catch (err) {
      console.error('HubSpot search error:', err)
      setError(err instanceof Error ? err.message : 'Search failed')
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    searchContacts(searchTerm)
  }

  const selectContact = (contact: HubSpotContact) => {
    onSelectContact(contact)
    setResults([])
    setSearchTerm('')
  }

  return (
    <div className="rounded-xl border border-surface-overlay/50 bg-surface-raised p-4">
      <h3 className="text-sm font-semibold text-white">HubSpot Contact Search</h3>
      <p className="mb-3 text-xs text-gray-400">Search HubSpot to load project contacts.</p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search contacts by name..."
            className="flex-1 rounded-lg border border-surface-overlay bg-surface px-3 py-2 text-sm text-white placeholder-gray-500 transition focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
          <Button type="submit" size="sm" icon={Search} loading={loading}>
            {loading ? 'Searching...' : 'Search'}
          </Button>
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        {results.length > 0 && (
          <div className="max-h-48 space-y-1.5 overflow-y-auto">
            {results.map((contact) => (
              <button
                key={contact.id}
                type="button"
                onClick={() => selectContact(contact)}
                className="w-full rounded-lg border border-surface-overlay/50 bg-surface p-3 text-left transition hover:border-accent/30 hover:bg-surface-raised"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-accent" />
                    <p className="text-sm font-medium text-white">
                      {contact.firstName} {contact.lastName}
                    </p>
                  </div>
                  {contact.companyName && (
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Building className="h-3.5 w-3.5" />
                      <span>{contact.companyName}</span>
                    </div>
                  )}
                  {contact.email && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Mail className="h-3.5 w-3.5" />
                      <span>{contact.email}</span>
                    </div>
                  )}
                  {contact.phone && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Phone className="h-3.5 w-3.5" />
                      <span>{contact.phone}</span>
                    </div>
                  )}
                  {(contact.contactAddress || contact.companyAddress) && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{contact.contactAddress || contact.companyAddress}</span>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </form>
    </div>
  )
}

export default HubSpotContactSearch
