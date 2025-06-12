import { ToolLike } from "../_typing";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";

interface MemoryEntry {
  key: string;
  value: any;
  category: "command" | "pattern" | "preference" | "knowledge" | "general";
  created: string;
  updated: string;
  accessed: string;
  accessCount: number;
  tags?: string[];
}

interface MemoryStore {
  version: string;
  entries: Record<string, MemoryEntry>;
  metadata: {
    created: string;
    lastModified: string;
    totalEntries: number;
  };
}

export const installProjectMemoryTool: ToolLike = (installer) => {
  installer("project-memory", "Persistent project context and knowledge management across sessions", {
    operation: z.enum(["save", "retrieve", "update", "delete", "list", "search"]).describe("Memory operation to perform"),
    key: z.string().optional().describe("Unique key for the memory entry"),
    value: z.any().optional().describe("Value to store (for save/update operations)"),
    category: z.enum(["command", "pattern", "preference", "knowledge", "general"]).optional().default("general").describe("Category of the memory entry"),
    tags: z.array(z.string()).optional().describe("Tags for categorization and search"),
    fuzzy_match: z.boolean().optional().default(false).describe("Use fuzzy matching for retrieval"),
    merge: z.boolean().optional().default(false).describe("Merge with existing value (for update)"),
    search_query: z.string().optional().describe("Search query for finding memories")
  }, async ({
    operation,
    key,
    value,
    category = "general",
    tags = [],
    fuzzy_match = false,
    merge = false,
    search_query
  }: {
    operation: "save" | "retrieve" | "update" | "delete" | "list" | "search";
    key?: string;
    value?: any;
    category?: "command" | "pattern" | "preference" | "knowledge" | "general";
    tags?: string[];
    fuzzy_match?: boolean;
    merge?: boolean;
    search_query?: string;
  }) => {
    try {
      const workspacePath = process.env.WORKSPACE_PATH || process.cwd();
      const memoryDir = path.join(workspacePath, ".autodev");
      const memoryFile = path.join(memoryDir, "memory.json");
      
      // Ensure directory exists
      if (!fs.existsSync(memoryDir)) {
        fs.mkdirSync(memoryDir, { recursive: true });
      }
      
      // Load existing memory store
      let store: MemoryStore = loadMemoryStore(memoryFile);
      
      switch (operation) {
        case "save": {
          if (!key) {
            return {
              content: [{
                type: "text",
                text: "Error: Key is required for save operation"
              }]
            };
          }
          
          if (value === undefined) {
            return {
              content: [{
                type: "text",
                text: "Error: Value is required for save operation"
              }]
            };
          }
          
          // Check if key already exists
          if (store.entries[key]) {
            return {
              content: [{
                type: "text",
                text: `Error: Key '${key}' already exists. Use 'update' operation to modify existing entries.`
              }]
            };
          }
          
          // Create new entry
          const now = new Date().toISOString();
          store.entries[key] = {
            key,
            value,
            category,
            created: now,
            updated: now,
            accessed: now,
            accessCount: 0,
            tags
          };
          
          store.metadata.totalEntries++;
          store.metadata.lastModified = now;
          
          // Save store
          saveMemoryStore(memoryFile, store);
          
          return {
            content: [{
              type: "text",
              text: `✅ Memory saved successfully\n\nKey: ${key}\nCategory: ${category}\nTags: ${tags.join(", ") || "none"}\nValue: ${JSON.stringify(value, null, 2)}`
            }]
          };
        }
        
        case "retrieve": {
          if (!key && !fuzzy_match) {
            return {
              content: [{
                type: "text",
                text: "Error: Key is required for retrieve operation (or enable fuzzy_match)"
              }]
            };
          }
          
          let entries: MemoryEntry[] = [];
          
          if (fuzzy_match && key) {
            // Fuzzy match
            const keyLower = key.toLowerCase();
            entries = Object.values(store.entries).filter(entry => 
              entry.key.toLowerCase().includes(keyLower) ||
              JSON.stringify(entry.value).toLowerCase().includes(keyLower) ||
              entry.tags?.some(tag => tag.toLowerCase().includes(keyLower))
            );
          } else if (key) {
            // Exact match
            const entry = store.entries[key];
            if (entry) {
              entries = [entry];
            }
          }
          
          if (entries.length === 0) {
            return {
              content: [{
                type: "text",
                text: `No memory found for key: ${key}`
              }]
            };
          }
          
          // Update access info
          entries.forEach(entry => {
            entry.accessed = new Date().toISOString();
            entry.accessCount++;
          });
          
          saveMemoryStore(memoryFile, store);
          
          // Format results
          const results = entries.map(entry => ({
            key: entry.key,
            value: entry.value,
            category: entry.category,
            tags: entry.tags,
            created: entry.created,
            accessed: entry.accessed,
            accessCount: entry.accessCount
          }));
          
          return {
            content: [{
              type: "text",
              text: JSON.stringify(results.length === 1 ? results[0] : results, null, 2)
            }]
          };
        }
        
        case "update": {
          if (!key) {
            return {
              content: [{
                type: "text",
                text: "Error: Key is required for update operation"
              }]
            };
          }
          
          if (value === undefined) {
            return {
              content: [{
                type: "text",
                text: "Error: Value is required for update operation"
              }]
            };
          }
          
          const entry = store.entries[key];
          if (!entry) {
            return {
              content: [{
                type: "text",
                text: `Error: No memory found with key '${key}'`
              }]
            };
          }
          
          // Update entry
          if (merge && typeof entry.value === "object" && typeof value === "object") {
            entry.value = { ...entry.value, ...value };
          } else {
            entry.value = value;
          }
          
          entry.updated = new Date().toISOString();
          entry.category = category;
          if (tags.length > 0) {
            entry.tags = tags;
          }
          
          store.metadata.lastModified = entry.updated;
          saveMemoryStore(memoryFile, store);
          
          return {
            content: [{
              type: "text",
              text: `✅ Memory updated successfully\n\nKey: ${key}\nMerged: ${merge}\nNew value: ${JSON.stringify(entry.value, null, 2)}`
            }]
          };
        }
        
        case "delete": {
          if (!key) {
            return {
              content: [{
                type: "text",
                text: "Error: Key is required for delete operation"
              }]
            };
          }
          
          if (!store.entries[key]) {
            return {
              content: [{
                type: "text",
                text: `Error: No memory found with key '${key}'`
              }]
            };
          }
          
          delete store.entries[key];
          store.metadata.totalEntries--;
          store.metadata.lastModified = new Date().toISOString();
          
          saveMemoryStore(memoryFile, store);
          
          return {
            content: [{
              type: "text",
              text: `✅ Memory entry '${key}' deleted successfully`
            }]
          };
        }
        
        case "list": {
          const entries = Object.values(store.entries);
          const categorized: Record<string, MemoryEntry[]> = {};
          
          // Group by category
          entries.forEach(entry => {
            if (!categorized[entry.category]) {
              categorized[entry.category] = [];
            }
            categorized[entry.category].push(entry);
          });
          
          let output = `# 📚 Project Memory Store\n\n`;
          output += `Total entries: ${store.metadata.totalEntries}\n`;
          output += `Last modified: ${store.metadata.lastModified}\n\n`;
          
          Object.entries(categorized).forEach(([cat, items]) => {
            output += `## ${cat.charAt(0).toUpperCase() + cat.slice(1)}\n\n`;
            items.forEach(item => {
              output += `- **${item.key}**: ${JSON.stringify(item.value).substring(0, 50)}...\n`;
              output += `  Tags: ${item.tags?.join(", ") || "none"} | Access: ${item.accessCount} times\n`;
            });
            output += "\n";
          });
          
          return {
            content: [{
              type: "text",
              text: output
            }]
          };
        }
        
        case "search": {
          if (!search_query) {
            return {
              content: [{
                type: "text",
                text: "Error: search_query is required for search operation"
              }]
            };
          }
          
          const queryLower = search_query.toLowerCase();
          const results = Object.values(store.entries).filter(entry => {
            const keyMatch = entry.key.toLowerCase().includes(queryLower);
            const valueMatch = JSON.stringify(entry.value).toLowerCase().includes(queryLower);
            const tagMatch = entry.tags?.some(tag => tag.toLowerCase().includes(queryLower));
            const categoryMatch = entry.category.toLowerCase().includes(queryLower);
            
            return keyMatch || valueMatch || tagMatch || categoryMatch;
          });
          
          if (results.length === 0) {
            return {
              content: [{
                type: "text",
                text: `No memories found matching: ${search_query}`
              }]
            };
          }
          
          let output = `# 🔍 Search Results for "${search_query}"\n\n`;
          output += `Found ${results.length} matching entries:\n\n`;
          
          results.forEach((entry, index) => {
            output += `### ${index + 1}. ${entry.key}\n`;
            output += `- Category: ${entry.category}\n`;
            output += `- Tags: ${entry.tags?.join(", ") || "none"}\n`;
            output += `- Value: ${JSON.stringify(entry.value, null, 2)}\n`;
            output += `- Last accessed: ${entry.accessed} (${entry.accessCount} times)\n\n`;
          });
          
          return {
            content: [{
              type: "text",
              text: output
            }]
          };
        }
        
        default:
          return {
            content: [{
              type: "text",
              text: `Error: Unknown operation '${operation}'`
            }]
          };
      }
    } catch (error: any) {
      return {
        content: [{
          type: "text",
          text: `Error in project memory: ${error.message}`
        }]
      };
    }
  });
};

// Helper function to load memory store
function loadMemoryStore(filePath: string): MemoryStore {
  if (fs.existsSync(filePath)) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      // If file is corrupted, create backup and start fresh
      const backupPath = `${filePath}.backup.${Date.now()}`;
      fs.copyFileSync(filePath, backupPath);
    }
  }
  
  // Return empty store
  return {
    version: "1.0.0",
    entries: {},
    metadata: {
      created: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      totalEntries: 0
    }
  };
}

// Helper function to save memory store
function saveMemoryStore(filePath: string, store: MemoryStore): void {
  const content = JSON.stringify(store, null, 2);
  fs.writeFileSync(filePath, content, 'utf8');
}