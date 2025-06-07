import { createOpenAI } from "@ai-sdk/openai";

export interface LLMConfig {
  provider: 'openai' | 'glm' | 'deepseek' | 'anthropic';
  apiKey: string;
  baseURL?: string;
  model: string;
}

export interface LLMProvider {
  name: string;
  model: any;
  isAvailable(): boolean;
}

/**
 * LLM Provider Factory - supports multiple LLM providers
 */
export class LLMProviderFactory {
  private static instance: LLMProviderFactory;
  private providers: Map<string, LLMProvider> = new Map();

  private constructor() {
    this.initializeProviders();
  }

  static getInstance(): LLMProviderFactory {
    if (!LLMProviderFactory.instance) {
      LLMProviderFactory.instance = new LLMProviderFactory();
    }
    return LLMProviderFactory.instance;
  }

  private initializeProviders(): void {
    // GLM Provider (智谱AI)
    if (process.env.GLM_TOKEN) {
      try {
        const glmProvider = createOpenAI({
          compatibility: "compatible",
          baseURL: process.env.LLM_BASE_URL || "https://open.bigmodel.cn/api/paas/v4",
          apiKey: process.env.GLM_TOKEN,
        });
        
        this.providers.set('glm', {
          name: 'GLM',
          model: glmProvider(process.env.LLM_MODEL || "glm-4-air"),
          isAvailable: () => !!process.env.GLM_TOKEN
        });
      } catch (error) {
        console.warn('Failed to initialize GLM provider:', error.message);
      }
    }

    // DeepSeek Provider
    if (process.env.DEEPSEEK_TOKEN) {
      try {
        const deepseekProvider = createOpenAI({
          compatibility: "compatible",
          baseURL: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1",
          apiKey: process.env.DEEPSEEK_TOKEN,
        });
        
        this.providers.set('deepseek', {
          name: 'DeepSeek',
          model: deepseekProvider(process.env.DEEPSEEK_MODEL || "deepseek-chat"),
          isAvailable: () => !!process.env.DEEPSEEK_TOKEN
        });
      } catch (error) {
        console.warn('Failed to initialize DeepSeek provider:', error.message);
      }
    }

    // OpenAI Provider
    if (process.env.OPENAI_API_KEY) {
      try {
        const openaiProvider = createOpenAI({
          apiKey: process.env.OPENAI_API_KEY,
          baseURL: process.env.OPENAI_BASE_URL,
        });
        
        this.providers.set('openai', {
          name: 'OpenAI',
          model: openaiProvider(process.env.OPENAI_MODEL || "gpt-4o-mini"),
          isAvailable: () => !!process.env.OPENAI_API_KEY
        });
      } catch (error) {
        console.warn('Failed to initialize OpenAI provider:', error.message);
      }
    }

    // Anthropic Provider (optional)
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        // Dynamically import Anthropic to make it optional
        const { createAnthropic } = require('@ai-sdk/anthropic');
        const anthropicProvider = createAnthropic({
          apiKey: process.env.ANTHROPIC_API_KEY,
        });

        this.providers.set('anthropic', {
          name: 'Anthropic',
          model: anthropicProvider(process.env.ANTHROPIC_MODEL || "claude-3-haiku-20240307"),
          isAvailable: () => !!process.env.ANTHROPIC_API_KEY
        });
      } catch (error) {
        console.warn('Anthropic provider not available (optional dependency):', error.message);
      }
    }
  }

  /**
   * Get the best available LLM provider
   */
  getBestProvider(): LLMProvider | null {
    // Priority order: GLM -> DeepSeek -> OpenAI -> Anthropic
    const priorityOrder = ['glm', 'deepseek', 'openai', 'anthropic'];
    
    for (const providerName of priorityOrder) {
      const provider = this.providers.get(providerName);
      if (provider && provider.isAvailable()) {
        console.log(`🤖 Using LLM provider: ${provider.name}`);
        return provider;
      }
    }

    console.warn('⚠️  No LLM providers available');
    return null;
  }

  /**
   * Get a specific provider by name
   */
  getProvider(name: string): LLMProvider | null {
    const provider = this.providers.get(name);
    if (provider && provider.isAvailable()) {
      return provider;
    }
    return null;
  }

  /**
   * Get all available providers
   */
  getAvailableProviders(): LLMProvider[] {
    return Array.from(this.providers.values()).filter(p => p.isAvailable());
  }

  /**
   * Check if any provider is available
   */
  hasAvailableProvider(): boolean {
    return this.getAvailableProviders().length > 0;
  }

  /**
   * Get provider status for debugging
   */
  getProviderStatus(): Record<string, { available: boolean; name: string }> {
    const status: Record<string, { available: boolean; name: string }> = {};
    
    for (const [key, provider] of this.providers.entries()) {
      status[key] = {
        available: provider.isAvailable(),
        name: provider.name
      };
    }

    return status;
  }
}

/**
 * Convenience function to get the best available LLM provider
 */
export function getBestLLMProvider(): LLMProvider | null {
  return LLMProviderFactory.getInstance().getBestProvider();
}

/**
 * Convenience function to check if any LLM provider is available
 */
export function hasLLMProvider(): boolean {
  return LLMProviderFactory.getInstance().hasAvailableProvider();
}
