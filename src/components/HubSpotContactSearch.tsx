import React, { useState } from 'react'
import { Search, Building, User, Phone, Mail, MapPin } from 'lucide-react'
import { HubSpotService, HubSpotContact } from '../services/hubspotService'

interface HubSpotContactSearchProps {
  onSelectContact: (contact: HubSpotContact) => void
}

const HubSpotContactSearch: React.FC<HubSpotContactSearchProps> = ({ onSelectContact }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState<HubSpotContact[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const searchContacts = async (term: string) => {
    if (!term.trim()) {
      setResults([])
      return
    }

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
    <div className="mb-6 rounded-2xl border border-accent/20 bg-surface-highlight/70 p-5 shadow-[0_28px_60px_rgba(10,18,35,0.5)] backdrop-blur-xl">
      <h3 className="text-lg font-semibold text-white">HubSpot Contact Search</h3>
      <p className="mb-4 text-sm text-slate-400">Search HubSpot and instantly load project contacts into the Volt workspace.</p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search contacts by name..."
            className="flex-1 rounded-xl border border-accent/25 bg-surface/80 px-4 py-2.5 text-sm text-white placeholder:text-slate-400 shadow-[0_12px_28px_rgba(8,16,28,0.45)] focus:border-accent focus:ring-2 focus:ring-accent/40"
          />
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-black shadow-sm transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Search className="h-4 w-4" />
            {loading ? 'Searching…' : 'Search'}
          </button>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        {results.length > 0 && (
          <div className="max-h-48 space-y-2 overflow-y-auto">
            {results.map((contact) => (
              <button
                key={contact.id}
                type="button"
                onClick={() => selectContact(contact)}
                className="w-full rounded-xl border border-accent/25 bg-accent-soft/40 p-3 text-left text-slate-100 transition hover:border-accent hover:bg-accent/15 hover:text-white"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-accent" />
                      <p className="font-medium text-white">
                        {contact.firstName} {contact.lastName}
                      </p>
                    </div>
                    {contact.companyName && (
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        <Building className="h-4 w-4 text-slate-400" />
                        <span>{contact.companyName}</span>
                      </div>
                    )}
                    {contact.email && (
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Mail className="h-4 w-4" />
                        <span>{contact.email}</span>
                      </div>
                    )}
                    {contact.phone && (
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Phone className="h-4 w-4" />
                        <span>{contact.phone}</span>
                      </div>
                    )}
                    {(contact.contactAddress || contact.companyAddress) && (
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <MapPin className="h-4 w-4" />
                        <span>{contact.contactAddress || contact.companyAddress}</span>
                      </div>
                    )}
                  </div>
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
