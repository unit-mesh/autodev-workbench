import { z } from "zod";
import { ToolLike } from "../../_typing";
import { FeatureRequestService } from "../../../services/feature-request-service";

/**
 * Feature Request Tool - Integrates testFeatureRequestImplementation functionality
 * 
 * This tool allows users to trigger automated feature development by providing
 * a description of the desired functionality. It uses the FeatureRequestPlaybook
 * to analyze requirements, search codebase, and generate implementation.
 */
export const installFeatureRequestTool: ToolLike = (installer) => {
  installer("feature-request", "Automatically analyze and implement feature requests using AI-powered development workflow", {
    description: z.string().describe("Detailed description of the feature to implement"),
    issue_number: z.number().optional().describe("GitHub issue number if this relates to a specific issue"),
    owner: z.string().optional().describe("GitHub repository owner (default: unit-mesh)"),
    repo: z.string().optional().describe("GitHub repository name (default: autodev-workbench)"),
    workspace_path: z.string().optional().describe("Path to the workspace directory (default: current directory)"),
    max_rounds: z.number().optional().describe("Maximum number of tool execution rounds (default: 8)"),
    validate_changes: z.boolean().optional().describe("Whether to validate that code changes were made (default: true)"),
    verbose: z.boolean().optional().describe("Enable verbose logging (default: false)")
  }, async ({
    description,
    issue_number,
    owner = "unit-mesh",
    repo = "autodev-workbench", 
    workspace_path,
    max_rounds = 8,
    validate_changes = true,
    verbose = false
  }: {
    description: string;
    issue_number?: number;
    owner?: string;
    repo?: string;
    workspace_path?: string;
    max_rounds?: number;
    validate_changes?: boolean;
    verbose?: boolean;
  }) => {
    try {
      // Validate required parameters
      if (!description?.trim()) {
        return {
          content: [{
            type: "text",
            text: "❌ Error: Feature description is required"
          }]
        };
      }

      // Create service instance
      const service = new FeatureRequestService({
        description: description.trim(),
        issueNumber: issue_number,
        owner,
        repo,
        workspacePath: workspace_path,
        verbose,
        maxToolRounds: max_rounds,
        validateCodeChanges: validate_changes
      });

      // Get agent info for logging
      const agentInfo = service.getAgentInfo();
      
      const startTime = Date.now();
      
      // Log start of feature request
      const logLines = [
        "🚀 Starting Feature Request Implementation",
        `📝 Description: ${description}`,
        ""
      ];

      if (issue_number) {
        logLines.push(`🔗 GitHub Issue: ${owner}/${repo}#${issue_number}`);
      }

      if (agentInfo) {
        logLines.push(`🤖 AI Agent: ${agentInfo.provider} (${agentInfo.model})`);
        logLines.push(`🔧 Available Tools: ${agentInfo.tools.length}`);
      }

      logLines.push(
        `⚙️ Configuration:`,
        `   • Max Rounds: ${max_rounds}`,
        `   • Validate Changes: ${validate_changes}`,
        `   • Verbose: ${verbose}`,
        ""
      );

      // Execute the feature request
      logLines.push("🧪 Executing feature request analysis and implementation...");
      
      const result = await service.implementFeature();
      const executionTime = Date.now() - startTime;

      // Build result summary
      logLines.push(
        "",
        "📊 Implementation Results:",
        `✅ Success: ${result.success}`,
        `🔄 Rounds: ${result.response.totalRounds || 1}`,
        `🛠️ Tools Used: ${result.toolsUsed.join(', ')}`,
        `💻 Code Modifications: ${result.codeModifications}`,
        `⏱️ Execution Time: ${executionTime}ms`,
        ""
      );

      // Add progress steps summary
      if (result.progressSteps.length > 0) {
        logLines.push("🔧 Progress Steps:");
        result.progressSteps.forEach((step, index) => {
          const status = step.status === 'completed' ? '✅' : '❌';
          logLines.push(`  ${index + 1}. ${step.step} - ${status}`);
          if (step.details) {
            logLines.push(`     ${step.details}`);
          }
        });
        logLines.push("");
      }

      // Add summary if available
      if (result.summary) {
        logLines.push("📄 Implementation Summary:");
        logLines.push(result.summary);
        logLines.push("");
      }

      // Add modified files if any
      if (result.codeModifications > 0) {
        const codeModificationTools = result.response.toolResults.filter(r => 
          r.functionCall.name === 'str-replace-editor' && r.success
        );
        
        if (codeModificationTools.length > 0) {
          logLines.push("📝 Modified Files:");
          codeModificationTools.forEach((tool, index) => {
            const params = tool.functionCall.parameters;
            logLines.push(`  ${index + 1}. ${params.targetFile || 'Unknown file'}`);
          });
          logLines.push("");
        }
      }

      // Add error information if failed
      if (!result.success && result.error) {
        logLines.push("❌ Error Details:");
        logLines.push(result.error);
        logLines.push("");
      }

      // Final status
      const finalStatus = result.success ? 
        "🎉 Feature request implementation completed successfully!" :
        "❌ Feature request implementation failed. Please check the error details above.";
      
      logLines.push(finalStatus);

      // Add recommendations
      if (result.success && result.codeModifications > 0) {
        logLines.push(
          "",
          "💡 Next Steps:",
          "• Review the generated code changes",
          "• Test the implemented functionality", 
          "• Consider adding unit tests",
          "• Update documentation if needed"
        );
      } else if (result.success && result.codeModifications === 0) {
        logLines.push(
          "",
          "💡 Note:",
          "• No code modifications were made",
          "• Check the implementation summary for guidance",
          "• Manual implementation may be required"
        );
      }

      return {
        content: [{
          type: "text",
          text: logLines.join('\n')
        }]
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      return {
        content: [{
          type: "text",
          text: `❌ Feature Request Tool Error: ${errorMessage}\n\nPlease check your configuration and try again.`
        }]
      };
    }
  });
};
