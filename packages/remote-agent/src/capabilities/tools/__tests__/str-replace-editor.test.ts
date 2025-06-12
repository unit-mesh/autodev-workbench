import { installStrReplaceEditorTool } from "../str-replace-editor";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

describe("str-replace-editor tool", () => {
  let tempDir: string;
  let testFile: string;
  let toolHandler: any;

  beforeEach(() => {
    // Create temporary directory and test file
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "str-replace-test-"));
    testFile = path.join(tempDir, "test.txt");
    
    // Create test file with sample content
    const testContent = `line 1
line 2
line 3
line 4
line 5`;
    fs.writeFileSync(testFile, testContent);

    // Set up workspace path
    process.env.WORKSPACE_PATH = tempDir;

    // Install the tool and capture the handler
    let capturedHandler: any;
    const mockInstaller = (name: string, description: string, schema: any, handler: any) => {
      capturedHandler = handler;
    };
    
    installStrReplaceEditorTool(mockInstaller);
    toolHandler = capturedHandler;
  });

  afterEach(() => {
    // Clean up temporary files
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    delete process.env.WORKSPACE_PATH;
  });

  test("should replace single line correctly", async () => {
    const result = await toolHandler({
      command: "str_replace",
      path: "test.txt",
      old_str_1: "line 2",
      new_str_1: "modified line 2",
      old_str_start_line_number_1: 2,
      old_str_end_line_number_1: 2,
      create_backup: false
    });

    expect(result.content[0].type).toBe("text");
    const response = JSON.parse(result.content[0].text);
    expect(response.operations).toContain("Replaced 1 lines (2-2) with 1 lines");

    const modifiedContent = fs.readFileSync(testFile, "utf8");
    expect(modifiedContent).toContain("modified line 2");
    const lines = modifiedContent.split('\n');
    expect(lines[1]).toBe("modified line 2");
    expect(lines).not.toContain("line 2");
  });

  test("should replace multiple lines correctly", async () => {
    const result = await toolHandler({
      command: "str_replace",
      path: "test.txt",
      old_str_1: "line 2\nline 3",
      new_str_1: "new line 2\nnew line 3",
      old_str_start_line_number_1: 2,
      old_str_end_line_number_1: 3,
      create_backup: false
    });

    expect(result.content[0].type).toBe("text");
    const response = JSON.parse(result.content[0].text);
    expect(response.operations).toContain("Replaced 2 lines (2-3) with 2 lines");

    const modifiedContent = fs.readFileSync(testFile, "utf8");
    expect(modifiedContent).toContain("new line 2");
    expect(modifiedContent).toContain("new line 3");
  });

  test("should insert content correctly", async () => {
    const result = await toolHandler({
      command: "insert",
      path: "test.txt",
      insert_line_1: 2,
      new_str_1: "inserted line",
      create_backup: false
    });

    expect(result.content[0].type).toBe("text");
    const response = JSON.parse(result.content[0].text);
    expect(response.operations).toContain("Inserted 1 lines after line 2");

    const modifiedContent = fs.readFileSync(testFile, "utf8");
    const lines = modifiedContent.split('\n');
    expect(lines[2]).toBe("inserted line");
    expect(lines.length).toBe(6); // Original 5 + 1 inserted
  });

  test("should handle dry run mode", async () => {
    const originalContent = fs.readFileSync(testFile, "utf8");
    
    const result = await toolHandler({
      command: "str_replace",
      path: "test.txt",
      old_str_1: "line 2",
      new_str_1: "modified line 2",
      old_str_start_line_number_1: 2,
      old_str_end_line_number_1: 2,
      dry_run: true
    });

    expect(result.content[0].type).toBe("text");
    const response = JSON.parse(result.content[0].text);
    expect(response.dry_run).toBe(true);

    // File should remain unchanged
    const currentContent = fs.readFileSync(testFile, "utf8");
    expect(currentContent).toBe(originalContent);
  });

  test("should create backup when requested", async () => {
    const result = await toolHandler({
      command: "str_replace",
      path: "test.txt",
      old_str_1: "line 2",
      new_str_1: "modified line 2",
      old_str_start_line_number_1: 2,
      old_str_end_line_number_1: 2,
      create_backup: true
    });

    expect(result.content[0].type).toBe("text");
    const response = JSON.parse(result.content[0].text);
    expect(response.backup_created).toBe(true);
    expect(response.backup_path).toBeTruthy();
    
    // Backup file should exist
    expect(fs.existsSync(response.backup_path)).toBe(true);
  });

  test("should handle string mismatch error", async () => {
    const result = await toolHandler({
      command: "str_replace",
      path: "test.txt",
      old_str_1: "wrong content",
      new_str_1: "replacement",
      old_str_start_line_number_1: 2,
      old_str_end_line_number_1: 2,
      create_backup: false
    });

    expect(result.content[0].type).toBe("text");
    expect(result.content[0].text).toContain("String mismatch");
  });

  test("should handle invalid line numbers", async () => {
    const result = await toolHandler({
      command: "str_replace",
      path: "test.txt",
      old_str_1: "line 2",
      new_str_1: "replacement",
      old_str_start_line_number_1: 10,
      old_str_end_line_number_1: 15,
      create_backup: false
    });

    expect(result.content[0].type).toBe("text");
    expect(result.content[0].text).toContain("Invalid line numbers");
  });

  test("should handle non-existent file", async () => {
    const result = await toolHandler({
      command: "str_replace",
      path: "nonexistent.txt",
      old_str_1: "content",
      new_str_1: "replacement",
      old_str_start_line_number_1: 1,
      old_str_end_line_number_1: 1
    });

    expect(result.content[0].type).toBe("text");
    expect(result.content[0].text).toContain("does not exist");
  });
});
