import { ToolLike } from "../_typing";
import { z } from "zod";

interface TaskStep {
  step: number;
  action: string;
  tool?: string;
  parameters?: any;
  result?: any;
  status: "pending" | "running" | "completed" | "failed";
  error?: string;
}

interface TaskPlan {
  task: string;
  steps: TaskStep[];
  context: Record<string, any>;
  constraints: string[];
  estimatedDuration: number;
}

export const installIntelligentAgentTool: ToolLike = (installer) => {
  installer("intelligent-agent", "Autonomous task execution agent that can plan and execute complex multi-step tasks", {
    task: z.string().describe("Clear description of the task to be accomplished"),
    context: z.string().optional().describe("Additional context or requirements for the task"),
    constraints: z.array(z.string()).optional().describe("Constraints or limitations to consider during execution"),
    max_steps: z.number().optional().default(10).describe("Maximum number of steps allowed for task completion"),
    auto_execute: z.boolean().optional().default(false).describe("Automatically execute the plan without confirmation"),
    verbose: z.boolean().optional().default(true).describe("Provide detailed progress updates")
  }, async ({
    task,
    context = "",
    constraints = [],
    max_steps = 10,
    auto_execute = false,
    verbose = true
  }: {
    task: string;
    context?: string;
    constraints?: string[];
    max_steps?: number;
    auto_execute?: boolean;
    verbose?: boolean;
  }) => {
    try {
      // Step 1: Analyze the task and create a plan
      const plan = await createTaskPlan(task, context, constraints, max_steps);
      
      if (!auto_execute) {
        // Return the plan for user review
        return {
          content: [
            {
              type: "text",
              text: formatPlanForReview(plan)
            }
          ]
        };
      }
      
      // Step 2: Execute the plan
      const executionLog: string[] = [];
      const startTime = Date.now();
      
      if (verbose) {
        executionLog.push(`🤖 Intelligent Agent Starting Task: ${task}`);
        executionLog.push(`📋 Plan: ${plan.steps.length} steps identified`);
        executionLog.push("─".repeat(50));
      }
      
      for (let i = 0; i < plan.steps.length; i++) {
        const step = plan.steps[i];
        step.status = "running";
        
        if (verbose) {
          executionLog.push(`\n🔄 Step ${step.step}: ${step.action}`);
          if (step.tool) {
            executionLog.push(`   Tool: ${step.tool}`);
            executionLog.push(`   Parameters: ${JSON.stringify(step.parameters, null, 2)}`);
          }
        }
        
        try {
          // Execute the step (this is a simulation - real implementation would call actual tools)
          const result = await executeStep(step, plan.context);
          step.result = result;
          step.status = "completed";
          
          // Update context with results
          plan.context[`step_${step.step}_result`] = result;
          
          if (verbose) {
            executionLog.push(`   ✅ Completed successfully`);
            if (result.summary) {
              executionLog.push(`   Result: ${result.summary}`);
            }
          }
        } catch (error: any) {
          step.status = "failed";
          step.error = error.message;
          
          if (verbose) {
            executionLog.push(`   ❌ Failed: ${error.message}`);
          }
          
          // Decide whether to continue or abort
          if (shouldAbortOnError(step, plan)) {
            executionLog.push("\n🛑 Task aborted due to critical error");
            break;
          }
        }
      }
      
      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;
      
      // Step 3: Generate final report
      const report = generateTaskReport(plan, executionLog, duration);
      
      return {
        content: [
          {
            type: "text",
            text: report
          }
        ]
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Error in intelligent agent: ${error.message}`
          }
        ]
      };
    }
  });
};

// Helper function to create a task plan
async function createTaskPlan(
  task: string,
  context: string,
  constraints: string[],
  maxSteps: number
): Promise<TaskPlan> {
  // This is a simplified implementation
  // Real implementation would use AI to analyze the task and create a plan
  
  const plan: TaskPlan = {
    task,
    steps: [],
    context: { originalContext: context },
    constraints,
    estimatedDuration: 0
  };
  
  // Example: Simple task decomposition based on keywords
  const taskLower = task.toLowerCase();
  
  if (taskLower.includes("analyze") && taskLower.includes("code")) {
    plan.steps.push({
      step: 1,
      action: "Search for relevant code files",
      tool: "semantic-code-search",
      parameters: { query: extractSearchQuery(task), max_results: 5 },
      status: "pending"
    });
    plan.steps.push({
      step: 2,
      action: "Read and analyze code structure",
      tool: "code-intelligence",
      parameters: { analysis_type: "structure" },
      status: "pending"
    });
    plan.steps.push({
      step: 3,
      action: "Generate analysis report",
      tool: "report-generator",
      parameters: { format: "markdown" },
      status: "pending"
    });
  } else if (taskLower.includes("fix") || taskLower.includes("bug")) {
    plan.steps.push({
      step: 1,
      action: "Identify the bug location",
      tool: "grep-search",
      parameters: { pattern: extractBugPattern(task) },
      status: "pending"
    });
    plan.steps.push({
      step: 2,
      action: "Analyze the bug context",
      tool: "read-file",
      parameters: { line_range: true },
      status: "pending"
    });
    plan.steps.push({
      step: 3,
      action: "Apply the fix",
      tool: "smart-file-editor",
      parameters: { mode: "patch" },
      status: "pending"
    });
    plan.steps.push({
      step: 4,
      action: "Verify the fix",
      tool: "run-tests",
      parameters: { scope: "affected" },
      status: "pending"
    });
  } else if (taskLower.includes("create") || taskLower.includes("implement")) {
    plan.steps.push({
      step: 1,
      action: "Analyze project structure",
      tool: "analyze-basic-context",
      parameters: {},
      status: "pending"
    });
    plan.steps.push({
      step: 2,
      action: "Generate implementation",
      tool: "code-generator",
      parameters: { specification: task },
      status: "pending"
    });
    plan.steps.push({
      step: 3,
      action: "Write files",
      tool: "write-file",
      parameters: {},
      status: "pending"
    });
  } else {
    // Generic plan for unrecognized tasks
    plan.steps.push({
      step: 1,
      action: "Analyze task requirements",
      tool: "task-analyzer",
      parameters: { task, context },
      status: "pending"
    });
    plan.steps.push({
      step: 2,
      action: "Execute main task",
      tool: "generic-executor",
      parameters: {},
      status: "pending"
    });
  }
  
  // Limit steps to maxSteps
  plan.steps = plan.steps.slice(0, maxSteps);
  
  // Estimate duration (simple heuristic: 30 seconds per step)
  plan.estimatedDuration = plan.steps.length * 30;
  
  return plan;
}

// Helper function to execute a single step
async function executeStep(step: TaskStep, context: Record<string, any>): Promise<any> {
  // This is a simulation - real implementation would call actual tools
  // For now, we'll return mock results
  
  await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate execution time
  
  const mockResults: Record<string, any> = {
    "semantic-code-search": {
      summary: "Found 3 relevant files",
      files: ["src/main.ts", "src/utils.ts", "src/types.ts"]
    },
    "code-intelligence": {
      summary: "Analyzed code structure",
      complexity: "medium",
      dependencies: 5
    },
    "grep-search": {
      summary: "Found 2 matches",
      matches: ["line 42: potential bug", "line 87: related code"]
    },
    "read-file": {
      summary: "Read file content",
      lines: 150
    },
    "smart-file-editor": {
      summary: "Applied changes",
      modified_lines: 3
    },
    "write-file": {
      summary: "Created new file",
      path: "src/new-feature.ts"
    }
  };
  
  return mockResults[step.tool || "default"] || {
    summary: "Step completed",
    status: "success"
  };
}

// Helper function to determine if task should abort on error
function shouldAbortOnError(step: TaskStep, plan: TaskPlan): boolean {
  // Critical steps that should abort the task if they fail
  const criticalActions = ["identify", "analyze", "read"];
  return criticalActions.some(action => step.action.toLowerCase().includes(action));
}

// Helper function to format plan for review
function formatPlanForReview(plan: TaskPlan): string {
  let output = "# 🤖 Intelligent Agent Task Plan\n\n";
  output += `**Task**: ${plan.task}\n\n`;
  
  if (plan.constraints.length > 0) {
    output += "**Constraints**:\n";
    plan.constraints.forEach(c => output += `- ${c}\n`);
    output += "\n";
  }
  
  output += `**Estimated Duration**: ${plan.estimatedDuration} seconds\n\n`;
  output += "## 📋 Execution Plan\n\n";
  
  plan.steps.forEach(step => {
    output += `### Step ${step.step}: ${step.action}\n`;
    if (step.tool) {
      output += `- **Tool**: \`${step.tool}\`\n`;
      output += `- **Parameters**: \`\`\`json\n${JSON.stringify(step.parameters, null, 2)}\n\`\`\`\n`;
    }
    output += "\n";
  });
  
  output += "---\n";
  output += "*To execute this plan automatically, set `auto_execute: true`*\n";
  
  return output;
}

// Helper function to generate final task report
function generateTaskReport(plan: TaskPlan, executionLog: string[], duration: number): string {
  let report = "# 🤖 Intelligent Agent Task Report\n\n";
  report += `**Task**: ${plan.task}\n`;
  report += `**Duration**: ${duration.toFixed(2)} seconds\n`;
  
  // Calculate success rate
  const completedSteps = plan.steps.filter(s => s.status === "completed").length;
  const successRate = (completedSteps / plan.steps.length * 100).toFixed(1);
  report += `**Success Rate**: ${successRate}% (${completedSteps}/${plan.steps.length} steps)\n\n`;
  
  // Add execution log
  report += "## 📝 Execution Log\n\n";
  report += "```\n";
  report += executionLog.join("\n");
  report += "\n```\n\n";
  
  // Add detailed results
  report += "## 📊 Detailed Results\n\n";
  plan.steps.forEach(step => {
    const icon = step.status === "completed" ? "✅" : step.status === "failed" ? "❌" : "⏸️";
    report += `### ${icon} Step ${step.step}: ${step.action}\n`;
    report += `- **Status**: ${step.status}\n`;
    if (step.result) {
      report += `- **Result**: ${JSON.stringify(step.result, null, 2)}\n`;
    }
    if (step.error) {
      report += `- **Error**: ${step.error}\n`;
    }
    report += "\n";
  });
  
  // Add recommendations
  if (successRate !== "100.0") {
    report += "## 💡 Recommendations\n\n";
    const failedSteps = plan.steps.filter(s => s.status === "failed");
    failedSteps.forEach(step => {
      report += `- Review and fix the issue in Step ${step.step}: ${step.error}\n`;
    });
  }
  
  return report;
}

// Helper functions for task analysis
function extractSearchQuery(task: string): string {
  // Extract meaningful search terms from the task description
  const keywords = task.match(/["']([^"']+)["']/) || task.match(/\b(\w+)\b/g);
  return keywords ? keywords[0].replace(/["']/g, '') : task;
}

function extractBugPattern(task: string): string {
  // Extract bug-related patterns from the task
  const patterns = task.match(/error|bug|issue|problem|exception/i);
  return patterns ? patterns[0] : "error";
}