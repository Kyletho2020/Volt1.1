import React, { useState, useEffect } from 'react'
import { Key, Save, Eye, EyeOff, CheckCircle, AlertCircle, Loader } from 'lucide-react'
import { ApiKeyService } from '../services/apiKeyService'

interface ApiKeySetupProps {
  onApiKeyChange: (hasKey: boolean) => void
}

const ApiKeySetup: React.FC<ApiKeySetupProps> = ({ onApiKeyChange }) => {
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [loading, setLoading] = useState(false)
  const [hasStoredKey, setHasStoredKey] = useState(false)
  const [checkingKey, setCheckingKey] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    checkForExistingKey()
  }, [])

  const checkForExistingKey = async () => {
    setCheckingKey(true)
    try {
      const hasKey = await ApiKeyService.hasApiKey()
      setHasStoredKey(hasKey)
      onApiKeyChange(hasKey)
    } catch (error) {
      console.error('Error checking for API key:', error)
    } finally {
      setCheckingKey(false)
    }
  }

  const handleSaveKey = async () => {
    if (!apiKey.trim()) {
      setMessage({ type: 'error', text: 'Please enter an API key' })
      return
    }

    if (!apiKey.startsWith('sk-')) {
      setMessage({ type: 'error', text: 'Invalid OpenAI API key format' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const success = await ApiKeyService.saveApiKey(apiKey)
      
      if (success) {
        setMessage({ type: 'success', text: 'API key saved successfully!' })
        setApiKey('')
        setHasStoredKey(true)
        onApiKeyChange(true)
      } else {
        setMessage({ type: 'error', text: 'Failed to save API key' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Error saving API key' })
    } finally {
      setLoading(false)
    }
  }

  if (checkingKey) {
    return (
      <div className="flex items-center justify-center p-4 text-white">
        <Loader className="w-5 h-5 animate-spin mr-2" />
        <span>Checking API key status...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center mb-4">
        <Key className="w-5 h-5 text-white mr-2" />
        <h3 className="text-lg font-semibold text-white">OpenAI API Key Setup</h3>
      </div>

      {message && (
        <div className={`p-3 rounded-lg flex items-center ${
          message.type === 'success'
            ? 'bg-gray-900 text-white border border-accent'
            : 'bg-black text-white border border-accent'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-4 h-4 mr-2" />
          ) : (
            <AlertCircle className="w-4 h-4 mr-2" />
          )}
          {message.text}
        </div>
      )}

      {hasStoredKey ? (
        <div className="p-3 bg-gray-900 text-white rounded-lg border border-accent">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-white mr-2" />
            <span className="text-white font-medium">API key is configured and ready</span>
          </div>
          <p className="text-sm text-white mt-1">
            You can now use the AI extraction feature.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-white">
            Enter your OpenAI API key to enable AI extraction. Get your API key from{' '}
            <a 
              href="https://platform.openai.com/api-keys" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-white hover:underline"
            >
              OpenAI's website
            </a>.
          </p>
          
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full px-4 py-3 pr-12 bg-black border border-accent rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent text-white placeholder-white"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white hover:text-white"
              disabled={loading}
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <button
            onClick={handleSaveKey}
            disabled={loading || !apiKey.trim()}
            className="flex items-center px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save API Key
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}

export default ApiKeySetup

