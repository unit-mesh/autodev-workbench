import { ToolLike } from "../_typing";
import { z } from "zod";
import { ProjectContextAnalyzer } from "./project-context-analyzer";

export const installAnalysisBasicContextTool: ToolLike = (installer) => {
  installer("analyze-basic-context", "Analyze project basic context, structure, and provide intelligent insights for planning", {
    workspace_path: z.string().optional().describe("Path to analyze (defaults to current directory)"),
    analysis_scope: z.enum(["basic", "full"]).optional().describe("Analysis scope: basic (essential info only) or full (detailed analysis)")
  }, async ({
    workspace_path,
    analysis_scope = "basic"
  }: {
    workspace_path?: string;
    analysis_scope?: "basic" | "full";
  }) => {
    try {
      // Resolve workspace path
      const workspacePath = workspace_path || process.env.WORKSPACE_PATH || process.cwd();
      
      // Create analyzer instance
      const analyzer = new ProjectContextAnalyzer();
      
      // Perform analysis
      const result = await analyzer.analyze(workspacePath, analysis_scope);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    } catch (error: any) {
      console.error('Error in analysis:', error);
      return {
        content: [
          {
            type: "text",
            text: `Error analyzing context: ${error.message}`
          }
        ]
      };
    }
  });
};