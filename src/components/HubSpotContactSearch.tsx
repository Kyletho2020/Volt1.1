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
    <div className="mb-6 p-4 bg-black rounded-lg border border-accent">
      <h3 className="text-lg font-semibold text-white mb-3">HubSpot Contact Search</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search contacts by name..."
            className="flex-1 px-3 py-2 bg-gray-900 border border-accent rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent text-white placeholder-white"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-accent text-black rounded-lg hover:bg-green-400 disabled:opacity-50 transition-colors"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
        
        {error && (
          <p className="text-red-400 text-sm">{error}</p>
        )}
        
        {results.length > 0 && (
          <div className="max-h-48 overflow-y-auto space-y-2">
            {results.map((contact) => (
              <div
                key={contact.id}
                onClick={() => selectContact(contact)}
                className="p-3 bg-gray-900 rounded-lg border border-gray-600 hover:border-accent cursor-pointer transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-1">
                      <User className="w-4 h-4 text-accent mr-2" />
                      <p className="font-medium text-white">
                        {contact.firstName} {contact.lastName}
                      </p>
                    </div>
                    {contact.companyName && (
                      <div className="flex items-center mb-1">
                        <Building className="w-4 h-4 text-gray-400 mr-2" />
                        <p className="text-sm text-gray-300">{contact.companyName}</p>
                      </div>
                    )}
                    {contact.email && (
                      <div className="flex items-center mb-1">
                        <Mail className="w-4 h-4 text-gray-400 mr-2" />
                        <p className="text-sm text-gray-400">{contact.email}</p>
                      </div>
                    )}
                    {contact.phone && (
                      <div className="flex items-center mb-1">
                        <Phone className="w-4 h-4 text-gray-400 mr-2" />
                        <p className="text-sm text-gray-400">{contact.phone}</p>
                      </div>
                    )}
                    {(contact.contactAddress || contact.companyAddress) && (
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                        <p className="text-sm text-gray-400">
                          {contact.contactAddress || contact.companyAddress}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </form>
    </div>
  )
}

export default HubSpotContactSearch