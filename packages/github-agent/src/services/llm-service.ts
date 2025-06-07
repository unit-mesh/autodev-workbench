import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { GitHubIssue } from "../types/index";

interface LLMKeywordAnalysis {
  primary_keywords: string[];
  technical_terms: string[];
  error_patterns: string[];
  component_names: string[];
  file_patterns: string[];
  search_strategies: string[];
  issue_type: string;
  confidence: number;
}

export class LLMService {
  private openai;
  private model: string;

  constructor() {
    // Configure LLM provider similar to web package
    this.openai = createOpenAI({
      compatibility: "compatible",
      baseURL: process.env.LLM_BASE_URL || "https://open.bigmodel.cn/api/paas/v4",
      apiKey: process.env.GLM_TOKEN || process.env.OPENAI_API_KEY,
    });
    this.model = process.env.LLM_MODEL || "glm-4-air";
  }

  async analyzeIssueForKeywords(issue: GitHubIssue): Promise<LLMKeywordAnalysis> {
    const prompt = this.buildKeywordExtractionPrompt(issue);
    
    try {
      const { text } = await generateText({
        model: this.openai(this.model),
        messages: [
          {
            role: "system",
            content: "You are an expert code analyst. Analyze GitHub issues and extract relevant keywords for code search. Always respond with valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3, // Lower temperature for more consistent results
      });

      // Parse the LLM response
      const analysis = this.parseKeywordAnalysis(text);
      return analysis;
    } catch (error) {
      console.warn(`LLM keyword analysis failed: ${error.message}`);
      // Fallback to rule-based extraction
      return this.fallbackKeywordExtraction(issue);
    }
  }

  private buildKeywordExtractionPrompt(issue: GitHubIssue): string {
    return `
Analyze this GitHub issue and extract keywords for code search:

**Issue Title:** ${issue.title}

**Issue Body:** ${issue.body || 'No description provided'}

**Labels:** ${issue.labels.map(l => l.name).join(', ') || 'None'}

Please extract keywords in the following categories and respond with JSON:

1. **primary_keywords**: Main concepts, feature names, error types (5-10 words)
2. **technical_terms**: Programming terms, frameworks, libraries, file extensions (5-15 words)
3. **error_patterns**: Specific error messages, exception types, error codes (3-8 phrases)
4. **component_names**: Likely class names, function names, module names (3-10 words)
5. **file_patterns**: Likely file names, directory patterns, file types (3-8 patterns)
6. **search_strategies**: Specific search terms that would help find related code (5-10 terms)
7. **issue_type**: One of: "bug", "feature", "performance", "documentation", "testing", "security", "refactor"
8. **confidence**: Float between 0.0-1.0 indicating confidence in the analysis

Focus on terms that would help find relevant code files, functions, and components.

Example response format:
{
  "primary_keywords": ["authentication", "login", "user", "session"],
  "technical_terms": ["jwt", "token", "middleware", "express", "nodejs"],
  "error_patterns": ["401 unauthorized", "token expired", "invalid credentials"],
  "component_names": ["AuthMiddleware", "LoginController", "UserService"],
  "file_patterns": ["auth", "login", "user", "middleware", "controller"],
  "search_strategies": ["authenticate", "verify", "token", "session", "login"],
  "issue_type": "bug",
  "confidence": 0.85
}

Respond only with valid JSON:`;
  }

  private parseKeywordAnalysis(text: string): LLMKeywordAnalysis {
    try {
      // Clean the response to extract JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate and normalize the response
      return {
        primary_keywords: Array.isArray(parsed.primary_keywords) ? parsed.primary_keywords.slice(0, 10) : [],
        technical_terms: Array.isArray(parsed.technical_terms) ? parsed.technical_terms.slice(0, 15) : [],
        error_patterns: Array.isArray(parsed.error_patterns) ? parsed.error_patterns.slice(0, 8) : [],
        component_names: Array.isArray(parsed.component_names) ? parsed.component_names.slice(0, 10) : [],
        file_patterns: Array.isArray(parsed.file_patterns) ? parsed.file_patterns.slice(0, 8) : [],
        search_strategies: Array.isArray(parsed.search_strategies) ? parsed.search_strategies.slice(0, 10) : [],
        issue_type: typeof parsed.issue_type === 'string' ? parsed.issue_type : 'general',
        confidence: typeof parsed.confidence === 'number' ? Math.max(0, Math.min(1, parsed.confidence)) : 0.5
      };
    } catch (error) {
      throw new Error(`Failed to parse LLM response: ${error.message}`);
    }
  }

  private fallbackKeywordExtraction(issue: GitHubIssue): LLMKeywordAnalysis {
    // Fallback to rule-based extraction if LLM fails
    const text = `${issue.title} ${issue.body || ''}`.toLowerCase();
    
    const primary = this.extractBasicKeywords(text);
    const technical = this.extractTechnicalTerms(text);
    const errors = this.extractErrorPatterns(text);
    
    return {
      primary_keywords: primary.slice(0, 8),
      technical_terms: technical.slice(0, 12),
      error_patterns: errors.slice(0, 5),
      component_names: this.extractComponentNames(text).slice(0, 8),
      file_patterns: this.extractFilePatterns(text).slice(0, 6),
      search_strategies: [...primary, ...technical].slice(0, 10),
      issue_type: this.detectIssueType(text),
      confidence: 0.6 // Lower confidence for fallback
    };
  }

  private extractBasicKeywords(text: string): string[] {
    const words = text.match(/\b\w{3,}\b/g) || [];
    const stopWords = new Set(['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'who', 'boy', 'did', 'man', 'way', 'she', 'use', 'this', 'that', 'with', 'have', 'from', 'they', 'know', 'want', 'been', 'good', 'much', 'some', 'time', 'very', 'when', 'come', 'here', 'just', 'like', 'long', 'make', 'many', 'over', 'such', 'take', 'than', 'them', 'well', 'were']);
    
    return [...new Set(words.filter(word => 
      !stopWords.has(word) && 
      word.length > 3 &&
      !/^\d+$/.test(word)
    ))];
  }

  private extractTechnicalTerms(text: string): string[] {
    const patterns = [
      /\b\w+\.(js|ts|jsx|tsx|py|java|go|rs|cpp|c|h|cs|php|rb|md)\b/g,
      /\b(function|class|interface|method|api|endpoint|route|component|service|controller|model|view|database|table|column|field|property|attribute|parameter|argument|variable|constant|enum|struct|union|namespace|package|module|import|export|async|await|promise|callback|event|listener|handler|middleware|decorator|annotation|generic|template|abstract|static|final|private|public|protected|override|virtual|extends|implements|inherits|throws|catch|try|finally|if|else|switch|case|default|for|while|do|break|continue|return|yield|new|delete|this|super|null|undefined|true|false)\b/gi,
      /\b(react|vue|angular|node|express|spring|django|flask|rails|laravel|symfony|asp\.net|blazor|xamarin|flutter|ionic|cordova|electron|webpack|vite|rollup|babel|typescript|javascript|python|java|kotlin|swift|objective-c|c\+\+|c#|go|rust|php|ruby|scala|clojure|haskell|erlang|elixir|dart|lua|perl|r|matlab|julia|fortran|cobol|assembly|sql|nosql|mongodb|postgresql|mysql|sqlite|redis|elasticsearch|docker|kubernetes|aws|azure|gcp|firebase|heroku|vercel|netlify|github|gitlab|bitbucket|jenkins|travis|circleci|jest|mocha|jasmine|cypress|selenium|puppeteer|playwright)\b/gi,
    ];
    
    const matches: string[] = [];
    patterns.forEach(pattern => {
      const found = text.match(pattern) || [];
      matches.push(...found);
    });
    
    return [...new Set(matches.map(m => m.toLowerCase()))];
  }

  private extractErrorPatterns(text: string): string[] {
    const patterns = [
      /"[^"]+error[^"]*"/gi,
      /'[^']+error[^']*'/gi,
      /\berror\s*:\s*[^\n]+/gi,
      /\bfailed\s*:\s*[^\n]+/gi,
      /\bexception\s*:\s*[^\n]+/gi,
      /\b\d{3}\s+(error|unauthorized|forbidden|not found|internal server error)/gi,
    ];
    
    const matches: string[] = [];
    patterns.forEach(pattern => {
      const found = text.match(pattern) || [];
      matches.push(...found.map(m => m.replace(/['"]/g, '').trim()));
    });
    
    return [...new Set(matches.filter(m => m.length > 5))];
  }

  private extractComponentNames(text: string): string[] {
    const patterns = [
      /\b[A-Z][a-zA-Z0-9]*Component\b/g,
      /\b[A-Z][a-zA-Z0-9]*Service\b/g,
      /\b[A-Z][a-zA-Z0-9]*Controller\b/g,
      /\b[A-Z][a-zA-Z0-9]*Manager\b/g,
      /\b[A-Z][a-zA-Z0-9]*Handler\b/g,
      /\b[a-z][a-zA-Z0-9]*[A-Z][a-zA-Z0-9]*\b/g, // camelCase
    ];
    
    const matches: string[] = [];
    patterns.forEach(pattern => {
      const found = text.match(pattern) || [];
      matches.push(...found);
    });
    
    return [...new Set(matches)];
  }

  private extractFilePatterns(text: string): string[] {
    const patterns = [
      /\b\w+\.(js|ts|jsx|tsx|py|java|go|rs|cpp|c|h|cs|php|rb|md|json|yaml|yml|xml|html|css|scss|sass|less)\b/g,
      /\b[a-z]+[-_][a-z]+\b/g, // kebab-case and snake_case
    ];
    
    const matches: string[] = [];
    patterns.forEach(pattern => {
      const found = text.match(pattern) || [];
      matches.push(...found.map(m => m.toLowerCase()));
    });
    
    return [...new Set(matches)];
  }

  private detectIssueType(text: string): string {
    if (text.includes('bug') || text.includes('error') || text.includes('fail') || text.includes('crash')) {
      return 'bug';
    } else if (text.includes('feature') || text.includes('enhancement') || text.includes('add') || text.includes('implement')) {
      return 'feature';
    } else if (text.includes('performance') || text.includes('slow') || text.includes('optimize')) {
      return 'performance';
    } else if (text.includes('test') || text.includes('spec') || text.includes('coverage')) {
      return 'testing';
    } else if (text.includes('doc') || text.includes('readme') || text.includes('comment')) {
      return 'documentation';
    } else if (text.includes('security') || text.includes('vulnerability') || text.includes('auth')) {
      return 'security';
    }
    
    return 'general';
  }
}
