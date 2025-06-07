/**
 * Hybrid Analysis Strategy
 * 
 * Combines LLM and rule-based analysis for optimal results.
 * Uses LLM when available, falls back to rule-based analysis.
 */

import { GitHubIssue } from "../../../types/index";
import { LLMService } from "../../llm-service";
import {
  BaseAnalysisStrategy,
  SearchKeywords,
  AnalysisContext,
  AnalysisResult
} from "../interfaces/IAnalysisStrategy";
import { LLMAnalysisStrategy } from "./LLMAnalysisStrategy";
import { RuleBasedAnalysisStrategy } from "./RuleBasedAnalysisStrategy";

export class HybridAnalysisStrategy extends BaseAnalysisStrategy {
  readonly name = 'hybrid';
  
  private llmStrategy: LLMAnalysisStrategy;
  private ruleBasedStrategy: RuleBasedAnalysisStrategy;
  private llmAvailable: boolean = false;

  constructor(
    llmService?: LLMService,
    options: {
      batchSize?: number;
      maxFilesToAnalyze?: number;
    } = {}
  ) {
    super();
    this.llmStrategy = new LLMAnalysisStrategy(llmService, options);
    this.ruleBasedStrategy = new RuleBasedAnalysisStrategy();
  }

  async generateKeywords(issue: GitHubIssue): Promise<SearchKeywords> {
    console.log('🔄 Generating keywords using hybrid analysis...');
    
    // Check if LLM is available
    this.llmAvailable = await this.llmStrategy.isAvailable();
    
    if (this.llmAvailable) {
      try {
        // Try LLM first
        const llmKeywords = await this.llmStrategy.generateKeywords(issue);
        console.log('✅ Using LLM-generated keywords');
        return llmKeywords;
      } catch (error) {
        console.warn('LLM keyword generation failed, falling back to rule-based:', error);
        this.llmAvailable = false;
      }
    }

    // Fall back to rule-based
    console.log('📋 Using rule-based keyword generation');
    return await this.ruleBasedStrategy.generateKeywords(issue);
  }

  async findRelevantFiles(
    context: AnalysisContext,
    keywords: SearchKeywords
  ): Promise<AnalysisResult['files']> {
    console.log('🔄 Finding relevant files using hybrid analysis...');

    if (this.llmAvailable) {
      try {
        // Try LLM analysis for better accuracy
        const llmFiles = await this.llmStrategy.findRelevantFiles(context, keywords);
        
        if (llmFiles.length > 0) {
          console.log('✅ Using LLM-analyzed files');
          return llmFiles;
        }
      } catch (error) {
        console.warn('LLM file analysis failed, falling back to rule-based:', error);
      }
    }

    // Fall back to rule-based or enhance rule-based with LLM insights
    console.log('📋 Using rule-based file analysis');
    const ruleBasedFiles = await this.ruleBasedStrategy.findRelevantFiles(context, keywords);

    // If LLM is available but failed for full analysis, try to enhance top files
    if (this.llmAvailable && ruleBasedFiles.length > 0) {
      return await this.enhanceFilesWithLLM(context, ruleBasedFiles.slice(0, 3));
    }

    return ruleBasedFiles;
  }

  async findRelevantSymbols(
    context: AnalysisContext,
    keywords: SearchKeywords
  ): Promise<AnalysisResult['symbols']> {
    // Symbols analysis is less resource-intensive, so we can try both approaches
    const ruleBasedSymbols = await this.ruleBasedStrategy.findRelevantSymbols(context, keywords);
    
    if (this.llmAvailable) {
      try {
        const llmSymbols = await this.llmStrategy.findRelevantSymbols(context, keywords);
        
        // Merge and deduplicate symbols
        return this.mergeSymbols(llmSymbols, ruleBasedSymbols);
      } catch (error) {
        console.warn('LLM symbol analysis failed, using rule-based only:', error);
      }
    }

    return ruleBasedSymbols;
  }

  async findRelevantApis(
    context: AnalysisContext,
    keywords: SearchKeywords
  ): Promise<AnalysisResult['apis']> {
    // API analysis is similar to symbols - try both if possible
    const ruleBasedApis = await this.ruleBasedStrategy.findRelevantApis(context, keywords);
    
    if (this.llmAvailable) {
      try {
        const llmApis = await this.llmStrategy.findRelevantApis(context, keywords);
        
        // Merge and deduplicate APIs
        return this.mergeApis(llmApis, ruleBasedApis);
      } catch (error) {
        console.warn('LLM API analysis failed, using rule-based only:', error);
      }
    }

    return ruleBasedApis;
  }

  calculateConfidence(result: AnalysisResult): number {
    // Hybrid analysis confidence depends on which methods were used
    const baseConfidence = super.calculateConfidence(result);
    
    if (this.llmAvailable) {
      // Higher confidence when LLM is available and used
      return Math.min(baseConfidence + 0.15, 1);
    }
    
    // Standard confidence for rule-based fallback
    return baseConfidence;
  }

  async isAvailable(): Promise<boolean> {
    // Hybrid is always available since it has rule-based fallback
    return true;
  }

  private async enhanceFilesWithLLM(
    context: AnalysisContext,
    files: AnalysisResult['files']
  ): Promise<AnalysisResult['files']> {
    console.log('🔍 Enhancing top files with LLM analysis...');
    
    const enhancedFiles: AnalysisResult['files'] = [];
    
    for (const file of files) {
      try {
        const llmAnalysis = await this.llmStrategy['llmService'].analyzeCodeRelevance(
          context.issue,
          file.path,
          file.content
        );
        
        if (llmAnalysis && llmAnalysis.is_relevant) {
          enhancedFiles.push({
            ...file,
            relevanceScore: Math.max(file.relevanceScore, llmAnalysis.relevance_score),
            reason: llmAnalysis.reason
          });
        } else {
          // Keep original if LLM doesn't find it relevant
          enhancedFiles.push(file);
        }
      } catch (error) {
        // Keep original on error
        enhancedFiles.push(file);
      }
    }
    
    return enhancedFiles.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  private mergeSymbols(
    llmSymbols: AnalysisResult['symbols'],
    ruleBasedSymbols: AnalysisResult['symbols']
  ): AnalysisResult['symbols'] {
    const symbolMap = new Map<string, AnalysisResult['symbols'][0]>();
    
    // Add rule-based symbols first
    for (const symbol of ruleBasedSymbols) {
      const key = `${symbol.name}:${symbol.location.file}:${symbol.location.line}`;
      symbolMap.set(key, symbol);
    }
    
    // Add or update with LLM symbols (they take precedence)
    for (const symbol of llmSymbols) {
      const key = `${symbol.name}:${symbol.location.file}:${symbol.location.line}`;
      symbolMap.set(key, symbol);
    }
    
    return Array.from(symbolMap.values()).slice(0, 15);
  }

  private mergeApis(
    llmApis: AnalysisResult['apis'],
    ruleBasedApis: AnalysisResult['apis']
  ): AnalysisResult['apis'] {
    const apiMap = new Map<string, AnalysisResult['apis'][0]>();
    
    // Add rule-based APIs first
    for (const api of ruleBasedApis) {
      const key = `${api.method}:${api.path}`;
      apiMap.set(key, api);
    }
    
    // Add or update with LLM APIs (they take precedence)
    for (const api of llmApis) {
      const key = `${api.method}:${api.path}`;
      apiMap.set(key, api);
    }
    
    return Array.from(apiMap.values()).slice(0, 10);
  }
}
