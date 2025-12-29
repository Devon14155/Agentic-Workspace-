
import React, { useState, useEffect } from 'react';
import { X, Shield, CheckCircle, AlertTriangle, ChevronDown, ChevronUp, Save, Key, Cpu, Zap, Sliders, Layers } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { PROVIDER_CONFIGS, MODEL_REGISTRY } from '../../services/ai/config/model-registry';
import { AIProviderId, AIConfig } from '../../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'keys' | 'defaults' | 'advanced';
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, defaultTab = 'keys' }) => {
  const { aiConfig, setAIConfig, themeMode, setTheme } = useStore();
  const [activeTab, setActiveTab] = useState<'keys' | 'defaults' | 'advanced'>(defaultTab);
  const [localConfig, setLocalConfig] = useState<AIConfig | null>(null);

  useEffect(() => {
    if (isOpen && aiConfig) {
      setLocalConfig(JSON.parse(JSON.stringify(aiConfig))); // Deep copy
    }
  }, [isOpen, aiConfig]);

  const handleSave = () => {
    if (localConfig) {
      setAIConfig(localConfig);
      onClose();
    }
  };

  const updateProviderKey = (id: AIProviderId, key: string) => {
    if (!localConfig) return;
    setLocalConfig({
      ...localConfig,
      providers: {
        ...localConfig.providers,
        [id]: { ...localConfig.providers[id], apiKey: key, isEnabled: !!key }
      }
    });
  };

  const updateDefaultModel = (key: keyof AIConfig['defaults'], value: string) => {
    if (!localConfig) return;
    setLocalConfig({
        ...localConfig,
        defaults: { ...localConfig.defaults, [key]: value }
    });
  };

  if (!isOpen || !localConfig) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl bg-white dark:bg-nexus-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-nexus-700 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-nexus-800">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-nexus-accent/10 rounded-lg">
                <Sliders className="w-5 h-5 text-nexus-accent" />
             </div>
             <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">AI Configuration</h2>
                <p className="text-xs text-slate-500">System Preferences & Provider Keys</p>
             </div>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-500" /></button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-60 bg-slate-50 dark:bg-nexus-950 border-r border-slate-200 dark:border-nexus-800 p-4 space-y-1">
            <button onClick={() => setActiveTab('keys')} className={`w-full flex items-center px-3 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'keys' ? 'bg-nexus-accent text-white shadow-lg shadow-nexus-accent/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-nexus-900'}`}>
              <Key className="w-4 h-4 mr-3" />API Keys (BYOK)
            </button>
            <button onClick={() => setActiveTab('defaults')} className={`w-full flex items-center px-3 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'defaults' ? 'bg-nexus-accent text-white shadow-lg shadow-nexus-accent/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-nexus-900'}`}>
              <Cpu className="w-4 h-4 mr-3" />Model Defaults
            </button>
            <button onClick={() => setActiveTab('advanced')} className={`w-full flex items-center px-3 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'advanced' ? 'bg-nexus-accent text-white shadow-lg shadow-nexus-accent/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-nexus-900'}`}>
              <Zap className="w-4 h-4 mr-3" />Advanced
            </button>
            
            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-nexus-800">
               <div className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase">Appearance</div>
               <div className="flex gap-2 px-1">
                   {['light', 'dark', 'system'].map((m) => (
                      <button key={m} onClick={() => setTheme(m as any)} className={`flex-1 py-1.5 text-xs border rounded-md capitalize ${themeMode === m ? 'border-nexus-accent text-nexus-accent bg-nexus-accent/5' : 'border-slate-300 dark:border-nexus-700 text-slate-500'}`}>{m}</button>
                   ))}
               </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-8 overflow-y-auto">
            
            {activeTab === 'keys' && (
              <div className="space-y-6">
                <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl p-4 flex gap-3">
                   <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
                   <div>
                     <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300">Secure Storage</h4>
                     <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">API keys are stored locally in your browser using AES encryption. They are never transmitted to our servers.</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {Object.values(AIProviderId).map((id) => {
                      const provider = PROVIDER_CONFIGS[id];
                      const config = localConfig.providers[id];
                      const [expanded, setExpanded] = useState(false);

                      return (
                        <div key={id} className={`border rounded-xl transition-all ${config?.isEnabled ? 'border-emerald-500/30 bg-emerald-50/5 dark:bg-emerald-500/5' : 'border-slate-200 dark:border-nexus-800'}`}>
                          <div className="px-5 py-4 flex items-center justify-between cursor-pointer" onClick={() => setExpanded(!expanded)}>
                             <div className="flex items-center gap-4">
                                {/* Placeholder for Icon */}
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${config?.isEnabled ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600' : 'bg-slate-100 dark:bg-nexus-800 text-slate-400'}`}>
                                   <Layers className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-800 dark:text-slate-200">{provider.name}</h3>
                                    <p className="text-xs text-slate-500">{config?.isEnabled ? 'Active' : 'Not Configured'}</p>
                                </div>
                             </div>
                             <div className="flex items-center gap-3">
                                {config?.isEnabled && <CheckCircle className="w-5 h-5 text-emerald-500" />}
                                {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                             </div>
                          </div>
                          
                          {expanded && (
                            <div className="px-5 pb-5 pt-0 animate-in slide-in-from-top-2">
                               <div className="h-px w-full bg-slate-200 dark:bg-nexus-800 mb-4"></div>
                               <div className="space-y-4">
                                  <div>
                                     <label className="block text-xs font-medium text-slate-500 mb-1">API Key</label>
                                     <input 
                                       type="password" 
                                       value={config?.apiKey || ''} 
                                       onChange={(e) => updateProviderKey(id, e.target.value)}
                                       placeholder={`sk-...`}
                                       className="w-full bg-slate-50 dark:bg-nexus-950 border border-slate-300 dark:border-nexus-700 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-nexus-accent/20 focus:border-nexus-accent outline-none transition-all"
                                     />
                                  </div>
                                  <div className="flex justify-between text-xs">
                                     <a href="#" className="text-nexus-accent hover:underline">Get API Key &rarr;</a>
                                     {id === AIProviderId.Ollama && <span className="text-amber-500">Ensure Ollama is running locally</span>}
                                  </div>
                               </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {activeTab === 'defaults' && (
              <div className="space-y-6">
                <div className="bg-slate-50 dark:bg-nexus-950 border border-slate-200 dark:border-nexus-800 rounded-xl p-6">
                   <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">Task-Specific Defaults</h3>
                   <div className="space-y-4">
                      {[
                        { key: 'generalModel', label: 'General Chat', desc: 'Everyday assistance' },
                        { key: 'reasoningModel', label: 'Deep Reasoning', desc: 'Complex problem solving' },
                        { key: 'codingModel', label: 'Coding Specialist', desc: 'Software engineering tasks' },
                        { key: 'visionModel', label: 'Image Analysis', desc: 'Multimodal vision tasks' },
                        { key: 'longContextModel', label: 'Long Context', desc: 'Large document processing' }
                      ].map((item) => (
                          <div key={item.key} className="flex items-center justify-between">
                             <div className="flex-1">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{item.label}</label>
                                <p className="text-xs text-slate-500">{item.desc}</p>
                             </div>
                             <select 
                               value={localConfig.defaults[item.key as keyof typeof localConfig.defaults]}
                               onChange={(e) => updateDefaultModel(item.key as any, e.target.value)}
                               className="bg-white dark:bg-nexus-900 border border-slate-300 dark:border-nexus-700 rounded-lg px-3 py-2 text-sm w-64 focus:ring-2 focus:ring-nexus-accent/20 outline-none"
                             >
                                {MODEL_REGISTRY.map(m => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                             </select>
                          </div>
                      ))}
                   </div>
                </div>
              </div>
            )}

            {activeTab === 'advanced' && (
                <div className="space-y-6">
                    <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                        <h4 className="flex items-center text-sm font-semibold text-amber-800 dark:text-amber-400 mb-2">
                            <AlertTriangle className="w-4 h-4 mr-2" /> Cost Control
                        </h4>
                        <div className="flex items-center justify-between mt-4">
                            <span className="text-sm text-slate-700 dark:text-slate-300">Warning Threshold</span>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-mono text-slate-500">$</span>
                                <input 
                                    type="number" 
                                    value={localConfig.preferences.costWarningThreshold}
                                    onChange={(e) => setLocalConfig({...localConfig, preferences: {...localConfig.preferences, costWarningThreshold: Number(e.target.value)}})}
                                    className="w-20 bg-white dark:bg-nexus-900 border border-slate-300 dark:border-nexus-700 rounded px-2 py-1 text-sm"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

          </div>
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-nexus-800 flex justify-end gap-3 bg-slate-50 dark:bg-nexus-950">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200">Cancel</button>
          <button onClick={handleSave} className="flex items-center px-6 py-2 bg-nexus-accent text-white rounded-lg hover:bg-indigo-600 transition-colors shadow-lg shadow-indigo-500/20 font-medium text-sm">
            <Save className="w-4 h-4 mr-2" /> Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
