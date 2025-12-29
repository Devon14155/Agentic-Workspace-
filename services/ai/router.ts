
import { AIModel, AIProviderId, ModelCapability } from '../../types';
import { MODEL_REGISTRY } from './config/model-registry';
import { GoogleProvider } from './providers/google';
import { OpenAICompatibleProvider } from './providers/openai';
import { AnthropicProvider } from './providers/anthropic';
import { GlmProvider } from './providers/glm';
import { OllamaProvider } from './providers/ollama';
import { DeepSeekProvider } from './providers/deepseek';
import { MoonshotProvider } from './providers/moonshot';
import { NanoBananaProvider } from './providers/nanobanana';
import { storage } from '../storage';

export interface RouterRequest {
  modelId: string;
  messages: Array<{ role: 'user' | 'model' | 'system'; content: string }>;
  capabilities?: ModelCapability[];
  tools?: any[];
  systemPrompt?: string;
}

class AIRouter {
  private providers: Map<AIProviderId, any> = new Map();
  private configLoaded = false;

  private async initializeProviders() {
    const config = await storage.getAIConfig();
    
    // Dedicated Providers
    this.providers.set(AIProviderId.Google, new GoogleProvider(config.providers[AIProviderId.Google]?.apiKey));
    this.providers.set(AIProviderId.Anthropic, new AnthropicProvider(config.providers[AIProviderId.Anthropic]?.apiKey));
    this.providers.set(AIProviderId.GLM, new GlmProvider(config.providers[AIProviderId.GLM]?.apiKey));
    this.providers.set(AIProviderId.Ollama, new OllamaProvider());
    this.providers.set(AIProviderId.DeepSeek, new DeepSeekProvider(config.providers[AIProviderId.DeepSeek]?.apiKey));
    this.providers.set(AIProviderId.Moonshot, new MoonshotProvider(config.providers[AIProviderId.Moonshot]?.apiKey));
    this.providers.set(AIProviderId.NanoBanana, new NanoBananaProvider(config.providers[AIProviderId.NanoBanana]?.apiKey));

    // OpenAI Compatible Providers (Shared Logic)
    // We group Grok, Mistral, Meta, and OpenAI here as they share strict API compatibility
    const openAICompatibles = [
      AIProviderId.OpenAI, 
      AIProviderId.Grok, 
      AIProviderId.Mistral,
      AIProviderId.Meta
    ];

    openAICompatibles.forEach(id => {
      const providerConfig = config.providers[id];
      if (providerConfig) {
        this.providers.set(id, new OpenAICompatibleProvider(
          id, 
          providerConfig.apiKey, 
          providerConfig.baseUrl
        ));
      }
    });

    this.configLoaded = true;
  }

  public async reloadConfig() {
    await this.initializeProviders();
  }

  public getModel(modelId: string): AIModel | undefined {
    return MODEL_REGISTRY.find(m => m.id === modelId);
  }

  public async chat(request: RouterRequest): Promise<{ text: string; toolCalls?: any[]; usage?: any; thinking?: string }> {
    if (!this.configLoaded) await this.initializeProviders();

    let model = this.getModel(request.modelId);
    
    // 1. CAPABILITY CHECK & AUTO-SWITCHING
    if (model && request.capabilities) {
      const missingCaps = request.capabilities.filter(cap => !model!.capabilities.includes(cap));
      
      if (missingCaps.length > 0) {
        console.warn(`Model ${model.name} missing capabilities [${missingCaps.join(',')}]. Searching for alternative...`);
        
        // Find replacement
        const replacement = MODEL_REGISTRY.find(m => 
          missingCaps.every(cap => m.capabilities.includes(cap)) && 
          m.providerId === model!.providerId // Prefer same provider
        ) || MODEL_REGISTRY.find(m => 
          missingCaps.every(cap => m.capabilities.includes(cap))
        );
        
        if (replacement) {
          console.log(`Auto-switched to ${replacement.name}`);
          model = replacement;
          request.modelId = replacement.id;
        } else {
          throw new Error(`No available model supports required capabilities: ${missingCaps.join(', ')}`);
        }
      }
    }

    if (!model) throw new Error(`Model ${request.modelId} not found in registry.`);

    // 2. GET PROVIDER
    const provider = this.providers.get(model.providerId);
    if (!provider) {
        await this.initializeProviders(); // Last ditch retry
        const retryProvider = this.providers.get(model.providerId);
        if (!retryProvider) throw new Error(`Provider ${model.providerId} not initialized.`);
        return this.executeRequest(retryProvider, request, model);
    }

    return this.executeRequest(provider, request, model);
  }

  private async executeRequest(provider: any, request: RouterRequest, model: AIModel) {
    try {
      // 3. EXECUTE
      return await provider.chat(request);
    } catch (error: any) {
      console.error(`Provider ${model.providerId} failed:`, error);
      
      // 4. FALLBACK LOGIC
      // If unauthorized, fail immediately. If server error, try fallback.
      if (error.message.includes('401') || error.message.includes('API Key')) {
         throw new Error(`Authentication failed for ${model.name}. Please check settings.`);
      }

      // Check for configured fallback
      const config = await storage.getAIConfig();
      // Simple fallback implementation: try Gemini Flash if primary wasn't Gemini
      if (model.id !== 'gemini-3-flash-preview' && config.providers[AIProviderId.Google]?.isEnabled) {
         console.warn("Attempting fallback to Gemini 3 Flash...");
         const fallbackProvider = this.providers.get(AIProviderId.Google);
         if (fallbackProvider) {
            return fallbackProvider.chat({ ...request, modelId: 'gemini-3-flash-preview' });
         }
      }

      throw error;
    }
  }
}

export const aiRouter = new AIRouter();
