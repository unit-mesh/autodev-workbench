import { join } from 'node:path'
import { AIAgent, AgentConfig, AgentResponse } from '../agent'
import { FeatureRequestPlaybook } from '../playbooks/feature-request-playbook'

export interface FeatureRequestConfig {
  owner?: string
  repo?: string
  issueNumber?: number
  description: string
  workspacePath?: string
  githubToken?: string
  verbose?: boolean
  maxToolRounds?: number
  validateCodeChanges?: boolean
}

export interface FeatureRequestResult {
  success: boolean
  codeModifications: number
  response: AgentResponse
  summary?: string
  error?: string
  executionTime: number
  toolsUsed: string[]
  progressSteps: {
    step: string
    status: 'completed' | 'failed'
    details?: string
  }[]
}

export class FeatureRequestService {
  private config: FeatureRequestConfig
  private agent: AIAgent | null = null

  constructor(config: FeatureRequestConfig) {
    this.config = {
      workspacePath: join(process.cwd(), '../../'),
      maxToolRounds: 8,
      verbose: false,
      validateCodeChanges: true,
      ...config
    }
  }

  /**
   * Initialize the AI agent with FeatureRequestPlaybook
   */
  private async initializeAgent(): Promise<void> {
    if (this.agent) return

    // Check environment
    if (!process.env.GITHUB_TOKEN && !this.config.githubToken) {
      throw new Error('GITHUB_TOKEN not found in environment or config')
    }

    const hasLLM = process.env.GLM_TOKEN || process.env.DEEPSEEK_TOKEN || process.env.OPENAI_API_KEY
    if (!hasLLM) {
      throw new Error('No LLM provider token found')
    }

    const agentConfig: AgentConfig = {
      workspacePath: this.config.workspacePath,
      githubToken: this.config.githubToken || process.env.GITHUB_TOKEN,
      verbose: this.config.verbose,
      maxToolRounds: this.config.maxToolRounds,
      enableToolChaining: true,
      playbook: new FeatureRequestPlaybook()
    }

    this.agent = new AIAgent(agentConfig)
  }

  /**
   * Execute feature request implementation
   */
  async implementFeature(): Promise<FeatureRequestResult> {
    const startTime = Date.now()

    try {
      await this.initializeAgent()
      
      if (!this.agent) {
        throw new Error('Failed to initialize agent')
      }

      // Prepare the prompt
      const prompt = this.buildPrompt()

      // Prepare context
      const context = this.buildContext()

      // Execute the feature request
      const response = await this.agent.start(prompt, context)
      const executionTime = Date.now() - startTime

      // Analyze results
      const result = this.analyzeResults(response, executionTime)

      return result

    } catch (error) {
      const executionTime = Date.now() - startTime
      
      return {
        success: false,
        codeModifications: 0,
        response: {
          text: '',
          toolResults: [],
          success: false,
          error: error instanceof Error ? error.message : String(error),
          totalRounds: 0,
          executionTime
        },
        error: error instanceof Error ? error.message : String(error),
        executionTime,
        toolsUsed: [],
        progressSteps: [
          {
            step: '初始化代理',
            status: 'failed',
            details: error instanceof Error ? error.message : String(error)
          }
        ]
      }
    }
  }

  /**
   * Build the prompt for feature request
   */
  private buildPrompt(): string {
    let prompt = `Analyze and implement the feature request: ${this.config.description}

Requirements:
1. First analyze the issue to understand the feature requirements
2. Search the codebase to understand the current implementation
3. Plan the implementation approach
4. Generate the necessary code changes
5. If code modification is not possible, provide detailed implementation guidance

Please provide a comprehensive analysis and implementation plan.`

    if (this.config.issueNumber) {
      prompt = `Analyze and implement the feature request from GitHub issue #${this.config.issueNumber}.

${prompt}`
    }

    return prompt
  }

  /**
   * Build context for the agent
   */
  private buildContext(): any {
    const context: any = {
      enableCodeModification: true,
      targetBranch: `feature/issue-${this.config.issueNumber || 'auto'}-automated`
    }

    if (this.config.issueNumber) {
      context.githubContext = {
        owner: this.config.owner || 'unit-mesh',
        repo: this.config.repo || 'autodev-workbench',
        issueNumber: this.config.issueNumber
      }
    }

    return context
  }

  /**
   * Analyze the results from agent execution
   */
  private analyzeResults(response: AgentResponse, executionTime: number): FeatureRequestResult {
    // Count code modifications
    const codeModificationTools = response.toolResults.filter(r => 
      r.functionCall.name === 'str-replace-editor' && r.success
    )

    // Extract tools used
    const toolsUsed = [...new Set(response.toolResults.map(r => r.functionCall.name))]

    // Generate progress steps based on tool results
    const progressSteps = this.generateProgressSteps(response.toolResults)

    // Extract summary
    const summary = this.extractSummary(response.text)

    // Analyze content quality
    const hasRequirements = response.text.toLowerCase().includes('requirement') || 
                           response.text.toLowerCase().includes('feature')
    const hasTechnicalAnalysis = response.text.toLowerCase().includes('technical') || 
                               response.text.toLowerCase().includes('implementation')
    const hasImplementationPlan = response.text.toLowerCase().includes('plan') || 
                                 response.text.toLowerCase().includes('roadmap')
    const hasCodeChanges = response.text.toLowerCase().includes('code') || 
                          response.text.toLowerCase().includes('implementation')

    // Determine overall success
    const testSuccess = response.success && 
                       response.totalRounds >= 2 && 
                       response.toolResults.length >= 4 &&
                       hasRequirements && 
                       hasTechnicalAnalysis &&
                       hasImplementationPlan &&
                       (this.config.validateCodeChanges ? codeModificationTools.length > 0 : true)

    return {
      success: testSuccess,
      codeModifications: codeModificationTools.length,
      response,
      summary,
      error: response.error,
      executionTime,
      toolsUsed,
      progressSteps
    }
  }

  /**
   * Generate progress steps based on tool results
   */
  private generateProgressSteps(toolResults: any[]): { step: string; status: 'completed' | 'failed'; details?: string }[] {
    const steps = [
      { step: '分析功能需求', status: 'completed' as const },
      { step: '搜索相关代码', status: 'completed' as const },
      { step: '生成实现方案', status: 'completed' as const },
    ]

    // Check if code modifications were made
    const hasCodeModifications = toolResults.some(r => 
      r.functionCall.name === 'str-replace-editor' && r.success
    )

    if (hasCodeModifications) {
      steps.push({ step: '修改代码文件', status: 'completed' })
    }

    return steps
  }

  /**
   * Extract summary from response text
   */
  private extractSummary(text: string): string {
    // Try to extract a meaningful summary
    const summaryMatch = text.match(/(?:executive summary|overview|summary)[:\s]*([^#]+?)(?=\n#|\n\n#|$)/i)
    if (summaryMatch) {
      return summaryMatch[1].trim().substring(0, 300) + '...'
    }

    // Fallback to implementation details
    const implMatch = text.match(/(?:implementation|code changes|technical implementation)[:\s]*([^#]+?)(?=\n#|\n\n#|$)/i)
    if (implMatch) {
      return implMatch[1].trim().substring(0, 300) + '...'
    }

    return '功能开发完成，请查看详细日志了解具体实现。'
  }

  /**
   * Get agent information
   */
  getAgentInfo(): { provider: string; model: string; tools: string[] } | null {
    if (!this.agent) return null
    
    const llmInfo = this.agent.getLLMInfo()
    const tools = this.agent.getAvailableTools()
    
    return {
      provider: llmInfo.provider,
      model: llmInfo.model,
      tools
    }
  }
}
