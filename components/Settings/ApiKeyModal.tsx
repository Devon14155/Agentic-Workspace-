import React, { useState } from 'react';
import { Key, ShieldCheck, ExternalLink, AlertTriangle, Loader2 } from 'lucide-react';
import { validateApiKey, setStoredApiKey } from '../../services/geminiService';

interface ApiKeyModalProps {
  onSuccess: () => void;
  isDismissible?: boolean;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onSuccess, isDismissible = false }) => {
  const [key, setKey] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim()) return;

    setIsValidating(true);
    setError(null);

    // Basic format check (Gemini keys usually start with AIza)
    if (!key.startsWith('AIza')) {
       setError("Invalid key format. Gemini keys typically start with 'AIza'.");
       setIsValidating(false);
       return;
    }

    const isValid = await validateApiKey(key);
    
    if (isValid) {
      setStoredApiKey(key);
      onSuccess();
    } else {
      setError("This API key appears to be invalid or expired. Please check your Google AI Studio dashboard.");
    }
    setIsValidating(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-nexus-900 border border-nexus-700 rounded-2xl shadow-2xl p-8 relative overflow-hidden">
        {/* Decorative background */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-nexus-accent/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 bg-nexus-success/10 rounded-full blur-3xl"></div>

        <div className="relative z-10">
          <div className="w-12 h-12 bg-nexus-800 rounded-xl flex items-center justify-center mb-6 border border-nexus-700 shadow-inner">
            <Key className="w-6 h-6 text-nexus-accent" />
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">Access Agentic Workspace</h2>
          <p className="text-slate-400 text-sm mb-6">
            To activate the agentic swarm, please provide your Google Gemini API Key. 
            Your key is stored locally in your browser and never sent to our servers.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-slate-500 mb-1.5 uppercase tracking-wider">Gemini API Key</label>
              <div className="relative group">
                <input
                  type="password"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="AIza..."
                  className="w-full bg-slate-950 border border-nexus-700 rounded-lg py-3 px-4 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-nexus-accent focus:ring-1 focus:ring-nexus-accent/50 transition-all font-mono text-sm"
                />
                <div className="absolute right-3 top-3 text-slate-600 group-focus-within:text-nexus-accent transition-colors">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isValidating || !key}
              className={`w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                isValidating || !key
                  ? 'bg-nexus-800 text-slate-500 cursor-not-allowed'
                  : 'bg-nexus-accent text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/25'
              }`}
            >
              {isValidating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Validating Credentials...
                </>
              ) : (
                'Initialize Workspace'
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-nexus-800 text-center">
            <a 
              href="https://aistudio.google.com/app/apikey" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center text-xs text-slate-500 hover:text-nexus-accent transition-colors"
            >
              Get a free API key from Google AI Studio
              <ExternalLink className="w-3 h-3 ml-1" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;