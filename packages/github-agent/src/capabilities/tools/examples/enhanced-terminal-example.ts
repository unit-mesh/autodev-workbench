/**
 * Enhanced Terminal Tools Usage Examples
 * 
 * Demonstrates the improved terminal and process management capabilities
 * with intelligent output analysis and interactive process control.
 */

import { 
  installRunTerminalCommandTool,
  installLaunchProcessTool,
  installReadTerminalTool,
  installWriteProcessTool,
  installListProcessesTool,
  installReadProcessTool,
  installKillProcessTool
} from "../index";

// Example: Enhanced terminal command execution
export async function demonstrateEnhancedTerminal() {
  console.log("=== Enhanced Terminal Command Execution ===");
  
  // Install the enhanced terminal tool
  let terminalHandler: any;
  const installer = (name: string, description: string, schema: any, handler: any) => {
    if (name === "run-terminal-command") {
      terminalHandler = handler;
    }
  };
  
  installRunTerminalCommandTool(installer);
  
  // Example 1: Basic command with intelligent analysis
  console.log("\n1. Basic command with analysis:");
  const basicResult = await terminalHandler({
    command: "npm",
    args: ["--version"],
    analyze_output: true,
    suggest_fixes: true,
    verbose: true
  });
  
  console.log("Result:", JSON.parse(basicResult.content[0].text));
  
  // Example 2: Long-running command with streaming
  console.log("\n2. Long-running command with streaming:");
  const streamResult = await terminalHandler({
    command: "npm",
    args: ["install", "--dry-run"],
    stream_output: true,
    max_output_lines: 50,
    timeout: 60000,
    analyze_output: true
  });
  
  console.log("Stream Result:", JSON.parse(streamResult.content[0].text));
  
  // Example 3: Command with error analysis
  console.log("\n3. Command with error analysis:");
  const errorResult = await terminalHandler({
    command: "nonexistent-command",
    analyze_output: true,
    suggest_fixes: true
  });
  
  console.log("Error Analysis:", JSON.parse(errorResult.content[0].text));
}

// Example: Process management workflow
export async function demonstrateProcessManagement() {
  console.log("\n=== Process Management Workflow ===");
  
  let launchHandler: any, listHandler: any, readHandler: any, killHandler: any;
  
  const installer = (name: string, description: string, schema: any, handler: any) => {
    switch (name) {
      case "launch-process": launchHandler = handler; break;
      case "list-processes": listHandler = handler; break;
      case "read-process": readHandler = handler; break;
      case "kill-process": killHandler = handler; break;
    }
  };
  
  installLaunchProcessTool(installer);
  installListProcessesTool(installer);
  installReadProcessTool(installer);
  installKillProcessTool(installer);
  
  // Step 1: Launch a background process
  console.log("\n1. Launching background process:");
  const launchResult = await launchHandler({
    command: "ping -c 5 google.com",
    wait: false,
    max_wait_seconds: 30
  });
  
  const processInfo = JSON.parse(launchResult.content[0].text);
  console.log("Launched:", processInfo);
  
  // Step 2: List all processes
  console.log("\n2. Listing all processes:");
  const listResult = await listHandler({
    filter: "all"
  });
  
  console.log("Process List:", JSON.parse(listResult.content[0].text));
  
  // Step 3: Read process output
  console.log("\n3. Reading process output:");
  const readResult = await readHandler({
    terminal_id: processInfo.terminal_id,
    wait: true,
    max_wait_seconds: 10
  });
  
  console.log("Process Output:", JSON.parse(readResult.content[0].text));
  
  // Step 4: Kill the process (if still running)
  console.log("\n4. Terminating process:");
  const killResult = await killHandler({
    terminal_id: processInfo.terminal_id,
    force: false,
    timeout: 5
  });
  
  console.log("Kill Result:", JSON.parse(killResult.content[0].text));
}

// Example: Interactive terminal session
export async function demonstrateInteractiveTerminal() {
  console.log("\n=== Interactive Terminal Session ===");
  
  let readTerminalHandler: any, writeProcessHandler: any;
  
  const installer = (name: string, description: string, schema: any, handler: any) => {
    switch (name) {
      case "read-terminal": readTerminalHandler = handler; break;
      case "write-process": writeProcessHandler = handler; break;
    }
  };
  
  installReadTerminalTool(installer);
  installWriteProcessTool(installer);
  
  // Read current terminal state
  console.log("\n1. Reading terminal state:");
  const terminalState = await readTerminalHandler({
    include_history: true,
    parse_output: true,
    filter_noise: true,
    lines: 20
  });
  
  console.log("Terminal State:", JSON.parse(terminalState.content[0].text));
  
  // Simulate writing to an interactive process
  console.log("\n2. Writing to interactive process:");
  const writeResult = await writeProcessHandler({
    terminal_id: 1,
    input_text: "help",
    add_newline: true
  });
  
  console.log("Write Result:", JSON.parse(writeResult.content[0].text));
}

// Tool capability comparison
export const ENHANCED_TERMINAL_CAPABILITIES = {
  "Original terminal-run-command": {
    features: [
      "Basic command execution",
      "Security validation", 
      "Timeout control",
      "Output capture"
    ],
    limitations: [
      "No process management",
      "No output analysis",
      "No interactive capabilities",
      "Limited error handling"
    ]
  },
  
  "Enhanced terminal-run-command": {
    features: [
      "Intelligent output analysis",
      "Error pattern detection",
      "Fix suggestions",
      "Real-time streaming",
      "Output truncation control",
      "Performance insights",
      "Verbose debugging",
      "Interactive mode support"
    ],
    newCapabilities: [
      "Smart error detection and suggestions",
      "Performance categorization",
      "Output pattern analysis",
      "Streaming support for long commands",
      "Enhanced security with better validation"
    ]
  },
  
  "Process Management Suite": {
    features: [
      "Background process execution",
      "Process lifecycle management",
      "Real-time output reading",
      "Interactive process communication",
      "Process status monitoring",
      "Graceful termination"
    ],
    useCases: [
      "Development server management",
      "Build process monitoring",
      "Interactive CLI tool control",
      "Long-running task management",
      "Multi-process coordination"
    ]
  },
  
  "Terminal Interaction Tools": {
    features: [
      "Terminal output reading",
      "Command history analysis",
      "Noise filtering",
      "Selected text reading",
      "Process input writing",
      "Intelligent parsing"
    ],
    advantages: [
      "Better context awareness",
      "Cleaner output processing",
      "Interactive session support",
      "Smart content filtering"
    ]
  }
};

// Common usage patterns
export const COMMON_WORKFLOWS = {
  "Development Server Management": {
    steps: [
      "1. Launch dev server with launch-process (wait=false)",
      "2. Monitor startup with read-process",
      "3. Check server health with run-terminal-command",
      "4. Read logs with read-terminal",
      "5. Restart if needed with kill-process + launch-process"
    ]
  },
  
  "Build Process Monitoring": {
    steps: [
      "1. Start build with launch-process",
      "2. Stream output with read-process (wait=true)",
      "3. Analyze errors with enhanced terminal analysis",
      "4. Get fix suggestions from intelligent analysis",
      "5. Apply fixes with str-replace-editor"
    ]
  },
  
  "Interactive Debugging": {
    steps: [
      "1. Launch debugger with launch-process",
      "2. Send commands with write-process",
      "3. Read responses with read-process",
      "4. Parse output with terminal analysis",
      "5. Continue debugging based on insights"
    ]
  }
};
