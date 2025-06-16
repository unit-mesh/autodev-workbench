import { AIAgent, AgentConfig, AgentResponse } from "../agent";
import { ToolResult } from "../agent/tool-definition";
import { FunctionParser } from "../agent/function-parser";

/**
 * Configuration options specific to CodeModificationAgent
 */
export interface CodeModificationConfig extends AgentConfig {
  // Strategy for code modification: 'analysis-first' (default), 'direct'
  modificationStrategy?: 'analysis-first' | 'direct';

  // Whether to create backups before modifying code
  createBackups?: boolean;

  // Whether to verify changes after modifications
  verifyChanges?: boolean;
}

/**
 * CodeModificationResponse extends AgentResponse with code-specific fields
 */
export interface CodeModificationResponse extends AgentResponse {
  modifiedFiles?: string[];
  totalChanges?: number;
}

/**
 * CodeModificationAgent extends AIAgent with specialized capabilities for modifying code
 * This implementation reuses the existing AIAgent architecture while adding code-specific features
 */
export class CodeModificationAgent extends AIAgent {
  protected modConfig: CodeModificationConfig;

  constructor(config: CodeModificationConfig = {}) {
    // Initialize the base AIAgent with the provided config
    super(config);

    // Set default values for code modification config
    this.modConfig = {
      modificationStrategy: 'analysis-first',
      createBackups: true,
      verifyChanges: true,
      ...config
    };

    this.log('CodeModificationAgent initialized with strategy:', this.modConfig.modificationStrategy);
  }

  /**
   * Override start method to add code modification specific flow
   */
  async start(userInput: string, context?: any): Promise<CodeModificationResponse> {
    const startTime = Date.now();

    try {
      this.log('Processing code modification request:', userInput);

      if (this.modConfig.modificationStrategy === 'direct') {
        return await this.processDirectModification(userInput, startTime, context);
      } else {
        return await this.processAnalysisFirstModification(userInput, startTime, context);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log('Error processing code modification:', errorMessage);

      return {
        text: '',
        toolResults: [],
        success: false,
        error: errorMessage,
        executionTime: Date.now() - startTime
      };
    }
  }

  /**
   * Direct modification strategy - immediately applies code changes without extensive analysis
   * Suitable for simple changes or when the user provides specific instructions
   */
  private async processDirectModification(userInput: string, startTime: number, context?: any): Promise<CodeModificationResponse> {
    // Enhance the user input with specific code modification instructions
    const enhancedInput = this.enhancePromptForDirectModification(userInput);

    // Use existing tool chaining process with modified prompt
    const response = await super.processInputWithToolChaining(enhancedInput, startTime, context) as AgentResponse;

    // Extract information about modified files
    const modifiedFiles = this.extractModifiedFiles(response.toolResults);

    return {
      ...response,
      modifiedFiles,
      totalChanges: modifiedFiles.length
    };
  }

  /**
   * Analysis-first modification strategy - analyzes code before making changes
   * More thorough approach that's suitable for complex refactoring
   */
  private async processAnalysisFirstModification(userInput: string, startTime: number, context?: any): Promise<CodeModificationResponse> {
    // Phase 1: Analysis phase
    this.log('Phase 1: Analyzing codebase before modification');
    const analysisPrompt = this.prepareAnalysisPrompt(userInput);

    // Use parent class to analyze the codebase
    const analysisResponse = await super.processInputWithToolChaining(analysisPrompt, startTime, context) as AgentResponse;

    if (!analysisResponse.success) {
      return {
        ...analysisResponse,
        text: `Failed during analysis phase: ${analysisResponse.error}`
      } as CodeModificationResponse;
    }

    // Phase 2: Modification phase based on analysis results
    this.log('Phase 2: Applying code modifications based on analysis');
    const modificationPrompt = this.prepareModificationPrompt(userInput, analysisResponse.text);

    // Call LLM to create a modification plan
    const messages = await this.promptBuilder.buildMessagesForRound(
      modificationPrompt,
      context,
      analysisResponse.toolResults,
      1,
      this.conversationHistory,
      this.config.workspacePath
    );

    const llmResponse = await this.callLLM(messages);
    const parsedResponse = FunctionParser.parseResponse(llmResponse);

    // Execute the modification plan
    const modResults = await this.toolExecutor.executeToolsWithContext({
      round: 2,
      previousResults: analysisResponse.toolResults,
      userInput,
      workspacePath: this.config.workspacePath || process.cwd()
    }, parsedResponse.functionCalls);

    // Combine all tool results
    const allToolResults = [...analysisResponse.toolResults, ...modResults];

    // Phase 3: Verification (if enabled)
    if (this.modConfig.verifyChanges) {
      this.log('Phase 3: Verifying code modifications');
      const verificationPrompt = this.prepareVerificationPrompt(userInput, modResults);

      const verificationMessages = await this.promptBuilder.buildMessagesForRound(
        verificationPrompt,
        context,
        allToolResults,
        3,
        this.conversationHistory,
        this.config.workspacePath
      );

      const verificationResponse = await this.callLLM(verificationMessages);
      const finalText = await this.responseGenerator.generateComprehensiveFinalResponse(
        userInput,
        verificationResponse,
        allToolResults,
        3
      );

      // Extract information about modified files
      const modifiedFiles = this.extractModifiedFiles(allToolResults);

      return {
        text: finalText,
        toolResults: allToolResults,
        success: true,
        totalRounds: 3,
        executionTime: Date.now() - startTime,
        modifiedFiles,
        totalChanges: modifiedFiles.length
      };
    }

    // Generate final response
    const finalText = await this.responseGenerator.generateComprehensiveFinalResponse(
      userInput,
      parsedResponse.text,
      allToolResults,
      2
    );

    // Extract information about modified files
    const modifiedFiles = this.extractModifiedFiles(allToolResults);

    return {
      text: finalText,
      toolResults: allToolResults,
      success: true,
      totalRounds: 2,
      executionTime: Date.now() - startTime,
      modifiedFiles,
      totalChanges: modifiedFiles.length
    };
  }

  /**
   * Extract the list of files modified from tool results
   */
  private extractModifiedFiles(toolResults: ToolResult[]): string[] {
    const modifiedFiles = new Set<string>();

    for (const result of toolResults) {
      if (result.success &&
         (result.functionCall.name === 'str-replace-editor' ||
          result.functionCall.name === 'fs-write-file')) {

        const targetFile = result.functionCall.parameters.targetFile;
        if (targetFile) {
          modifiedFiles.add(targetFile);
        }
      }
    }

    return Array.from(modifiedFiles);
  }

  /**
   * Enhance the prompt for direct modification
   */
  private enhancePromptForDirectModification(userInput: string): string {
    return `TASK: Modify code based on the following request. Implement the changes directly. 
CREATE BACKUPS: ${this.modConfig.createBackups}
USER REQUEST: ${userInput}

Instructions:
1. Use the str-replace-editor tool for precise code changes
2. Use fs-write-file only for new files
3. Maintain code style consistency
4. Ensure all necessary imports are added
5. Focus on making the minimum necessary changes to achieve the goal`;
  }

  /**
   * Prepare analysis prompt for first phase
   */
  private prepareAnalysisPrompt(userInput: string): string {
    return `ANALYSIS PHASE: Analyze the codebase to understand the structure and context before making any changes.
USER REQUEST: ${userInput}

Instructions:
1. Use code search tools to find relevant files
2. Read and understand the code structure
3. Identify dependencies and relationships
4. DO NOT make any code modifications yet
5. Prepare a thorough analysis of what needs to be modified`;
  }

  /**
   * Prepare modification prompt for second phase
   */
  private prepareModificationPrompt(userInput: string, analysis: string): string {
    return `MODIFICATION PHASE: Based on the analysis, now implement the code changes.
USER REQUEST: ${userInput}

ANALYSIS RESULTS:
${analysis}

Instructions:
1. Use the str-replace-editor tool for precise code changes
2. Create backups: ${this.modConfig.createBackups}
3. Make minimal changes to achieve the objective
4. Ensure all imports are correctly updated
5. Maintain consistent code style`;
  }

  /**
   * Prepare verification prompt
   */
  private prepareVerificationPrompt(userInput: string, modResults: ToolResult[]): string {
    const modifiedFiles = this.extractModifiedFiles(modResults);

    return `VERIFICATION PHASE: Verify the code modifications are correct and accomplish the requested task.
USER REQUEST: ${userInput}

MODIFIED FILES:
${modifiedFiles.join('\n')}

Instructions:
1. Check if the modifications properly implement the requested changes
2. Verify syntax correctness
3. Check for any potential runtime issues
4. Suggest any additional improvements if necessary`;
  }
}
