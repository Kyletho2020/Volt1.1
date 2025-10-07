import React, { useState, useEffect } from 'react';
import { Key, Save, Trash2, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';

interface SimpleApiKeyManagerProps {
  onApiKeySet: (hasKey: boolean, keyId?: string) => void;
}

const SimpleApiKeyManager: React.FC<SimpleApiKeyManagerProps> = ({ onApiKeySet }) => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [storedKeyId, setStoredKeyId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    // Use the fixed UUID for stored_api_key
    setStoredKeyId('c9f1ba25-04c8-4e36-b942-ff20dfa3d8b3');
    onApiKeySet(true, 'c9f1ba25-04c8-4e36-b942-ff20dfa3d8b3');
  }, [onApiKeySet]);

  const saveApiKey = async () => {
    if (!apiKey.trim()) {
      setMessage({ type: 'error', text: 'Please enter an API key' });
      return;
    }

    if (!apiKey.startsWith('sk-')) {
      setMessage({ type: 'error', text: 'Invalid OpenAI API key format' });
      return;
    }

    setLoading(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const manualKey = import.meta.env.VITE_SUPABASE_MANUAL_KEY
      
      if (!supabaseUrl || !manualKey) {
        throw new Error('Supabase configuration missing')
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/store-api-key-simple`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${manualKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          apiKey,
          keyId: 'c9f1ba25-04c8-4e36-b942-ff20dfa3d8b3'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to store API key');
      }

      // Use the fixed UUID for stored_api_key
      setStoredKeyId('c9f1ba25-04c8-4e36-b942-ff20dfa3d8b3');
      setMessage({ type: 'success', text: 'API key saved successfully!' });
      setApiKey('');
      onApiKeySet(true, data.keyId);
    } catch (error) {
      console.error('Error saving API key:', error);
      setMessage({ type: 'error', text: 'Failed to save API key' });
    } finally {
      setLoading(false);
    }
  };

  const deleteApiKey = async () => {
    // Reset to null for deletion
    setStoredKeyId(null);
    setMessage({ type: 'success', text: 'API key removed successfully!' });
    onApiKeySet(false);
  };

  return (
    <div className="bg-gray-900 rounded-lg border-2 border-accent p-6 text-white">
      <div className="flex items-center mb-4">
        <Key className="w-5 h-5 text-white mr-2" />
        <h3 className="text-lg font-semibold text-white">OpenAI API Key Setup</h3>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-lg flex items-center ${
          message.type === 'success'
            ? 'bg-gray-900 text-white border border-accent'
            : 'bg-gray-900 text-white border border-accent'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-4 h-4 mr-2" />
          ) : (
            <AlertCircle className="w-4 h-4 mr-2" />
          )}
          {message.text}
        </div>
      )}

      {storedKeyId ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg border border-accent">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-white mr-2" />
              <span className="text-white font-medium">API key is configured</span>
            </div>
            <button
              onClick={deleteApiKey}
              className="flex items-center px-3 py-1 text-white hover:bg-gray-800 hover:text-white rounded transition-colors"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Remove
            </button>
          </div>
          <p className="text-sm text-white">
            Your OpenAI API key is securely stored. You can now use the AI extraction feature.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-white">
            Enter your OpenAI API key to use AI extraction. Get your API key from{' '}
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
              className="w-full px-4 py-3 pr-12 bg-black text-white placeholder-white border border-accent rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white hover:text-white"
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <button
            onClick={saveApiKey}
            disabled={loading || !apiKey.trim()}
            className="flex items-center px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Saving...' : 'Save API Key'}
          </button>
        </div>
      )}
    </div>
  );
};

export default SimpleApiKeyManager;
