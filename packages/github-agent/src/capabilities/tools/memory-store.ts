import { ToolLike } from "../_typing";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";

interface Memory {
  id: string;
  key: string;
  value: any;
  type: "fact" | "preference" | "context" | "learning" | "temporary";
  created_at: string;
  updated_at: string;
  expires_at?: string;
  tags?: string[];
  importance: "low" | "medium" | "high" | "critical";
  source?: string;
  related_memories?: string[];
}

export const installMemoryStoreTool: ToolLike = (installer) => {
  installer("memory-store", "Store and retrieve memories, facts, preferences, and learned information", {
    action: z.enum(["store", "retrieve", "update", "delete", "search", "list", "cleanup"]).describe("Action to perform"),
    key: z.string().optional().describe("Memory key (required for store, retrieve, update, delete)"),
    value: z.any().optional().describe("Value to store (required for store)"),
    type: z.enum(["fact", "preference", "context", "learning", "temporary"]).optional().describe("Type of memory"),
    importance: z.enum(["low", "medium", "high", "critical"]).optional().describe("Importance level"),
    tags: z.array(z.string()).optional().describe("Tags for categorization"),
    expires_in_hours: z.number().optional().describe("Hours until memory expires (for temporary memories)"),
    source: z.string().optional().describe("Source of the memory"),
    related_keys: z.array(z.string()).optional().describe("Related memory keys"),
    search_query: z.string().optional().describe("Search query for finding memories"),
    filter: z.object({
      type: z.array(z.string()).optional(),
      importance: z.array(z.string()).optional(),
      tags: z.array(z.string()).optional(),
      source: z.string().optional()
    }).optional().describe("Filters for list/search actions")
  }, async ({ 
    action,
    key,
    value,
    type,
    importance,
    tags,
    expires_in_hours,
    source,
    related_keys,
    search_query,
    filter
  }: { 
    action: "store" | "retrieve" | "update" | "delete" | "search" | "list" | "cleanup";
    key?: string;
    value?: any;
    type?: "fact" | "preference" | "context" | "learning" | "temporary";
    importance?: "low" | "medium" | "high" | "critical";
    tags?: string[];
    expires_in_hours?: number;
    source?: string;
    related_keys?: string[];
    search_query?: string;
    filter?: {
      type?: string[];
      importance?: string[];
      tags?: string[];
      source?: string;
    };
  }) => {
    try {
      // Get memory file path
      const workspacePath = process.env.WORKSPACE_PATH || process.cwd();
      const memoryFilePath = path.join(workspacePath, '.autodev', 'memory.json');
      
      // Ensure .autodev directory exists
      const autodirPath = path.dirname(memoryFilePath);
      if (!fs.existsSync(autodirPath)) {
        fs.mkdirSync(autodirPath, { recursive: true });
      }

      // Load existing memories
      let memories: Memory[] = [];
      if (fs.existsSync(memoryFilePath)) {
        try {
          const memoryData = fs.readFileSync(memoryFilePath, 'utf8');
          memories = JSON.parse(memoryData);
        } catch (error) {
          console.warn('Warning: Could not parse existing memory file, starting fresh');
        }
      }

      // Generate unique ID
      function generateId(): string {
        return 'mem_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
      }

      // Save memories to file
      function saveMemories(memories: Memory[]): void {
        fs.writeFileSync(memoryFilePath, JSON.stringify(memories, null, 2));
      }

      // Clean up expired memories
      function cleanupExpired(): number {
        const now = new Date();
        const beforeCount = memories.length;
        memories = memories.filter(memory => {
          if (memory.expires_at) {
            return new Date(memory.expires_at) > now;
          }
          return true;
        });
        return beforeCount - memories.length;
      }

      // Search memories by query
      function searchMemories(query: string): Memory[] {
        const lowerQuery = query.toLowerCase();
        return memories.filter(memory => {
          const keyMatch = memory.key.toLowerCase().includes(lowerQuery);
          const valueMatch = JSON.stringify(memory.value).toLowerCase().includes(lowerQuery);
          const tagMatch = memory.tags?.some(tag => tag.toLowerCase().includes(lowerQuery));
          const sourceMatch = memory.source?.toLowerCase().includes(lowerQuery);
          
          return keyMatch || valueMatch || tagMatch || sourceMatch;
        });
      }

      // Apply filters
      function applyFilters(memories: Memory[], filter: any): Memory[] {
        let filtered = memories;

        if (filter?.type && filter.type.length > 0) {
          filtered = filtered.filter(m => filter.type.includes(m.type));
        }
        if (filter?.importance && filter.importance.length > 0) {
          filtered = filtered.filter(m => filter.importance.includes(m.importance));
        }
        if (filter?.tags && filter.tags.length > 0) {
          filtered = filtered.filter(m => 
            filter.tags.some((tag: string) => m.tags?.includes(tag))
          );
        }
        if (filter?.source) {
          filtered = filtered.filter(m => m.source === filter.source);
        }

        return filtered;
      }

      let result: any = {};

      switch (action) {
        case "store":
          if (!key || value === undefined) {
            return {
              content: [
                {
                  type: "text",
                  text: "Error: 'key' and 'value' are required for storing a memory."
                }
              ]
            };
          }

          // Check if memory already exists
          const existingIndex = memories.findIndex(m => m.key === key);
          
          const expiresAt = expires_in_hours 
            ? new Date(Date.now() + expires_in_hours * 60 * 60 * 1000).toISOString()
            : undefined;

          const newMemory: Memory = {
            id: generateId(),
            key: key,
            value: value,
            type: type || "fact",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            expires_at: expiresAt,
            tags: tags || [],
            importance: importance || "medium",
            source: source,
            related_memories: related_keys || []
          };

          if (existingIndex >= 0) {
            // Update existing memory
            newMemory.created_at = memories[existingIndex].created_at;
            memories[existingIndex] = newMemory;
            result = {
              action: "store",
              operation: "updated",
              memory: newMemory,
              message: `Memory '${key}' updated successfully.`
            };
          } else {
            // Create new memory
            memories.push(newMemory);
            result = {
              action: "store",
              operation: "created",
              memory: newMemory,
              message: `Memory '${key}' stored successfully.`
            };
          }

          saveMemories(memories);
          break;

        case "retrieve":
          if (!key) {
            return {
              content: [
                {
                  type: "text",
                  text: "Error: 'key' is required for retrieving a memory."
                }
              ]
            };
          }

          const memory = memories.find(m => m.key === key);
          if (!memory) {
            return {
              content: [
                {
                  type: "text",
                  text: `Error: Memory with key '${key}' not found.`
                }
              ]
            };
          }

          // Check if memory has expired
          if (memory.expires_at && new Date(memory.expires_at) <= new Date()) {
            // Remove expired memory
            const expiredIndex = memories.findIndex(m => m.key === key);
            memories.splice(expiredIndex, 1);
            saveMemories(memories);
            
            return {
              content: [
                {
                  type: "text",
                  text: `Error: Memory with key '${key}' has expired and was removed.`
                }
              ]
            };
          }

          result = {
            action: "retrieve",
            memory: memory,
            related_memories: memory.related_memories?.map(relatedKey => 
              memories.find(m => m.key === relatedKey)
            ).filter(Boolean) || []
          };
          break;

        case "update":
          if (!key) {
            return {
              content: [
                {
                  type: "text",
                  text: "Error: 'key' is required for updating a memory."
                }
              ]
            };
          }

          const updateIndex = memories.findIndex(m => m.key === key);
          if (updateIndex === -1) {
            return {
              content: [
                {
                  type: "text",
                  text: `Error: Memory with key '${key}' not found.`
                }
              ]
            };
          }

          const existingMemory = memories[updateIndex];
          const updatedMemory: Memory = {
            ...existingMemory,
            value: value !== undefined ? value : existingMemory.value,
            type: type || existingMemory.type,
            importance: importance || existingMemory.importance,
            tags: tags || existingMemory.tags,
            source: source !== undefined ? source : existingMemory.source,
            related_memories: related_keys || existingMemory.related_memories,
            updated_at: new Date().toISOString(),
            expires_at: expires_in_hours 
              ? new Date(Date.now() + expires_in_hours * 60 * 60 * 1000).toISOString()
              : existingMemory.expires_at
          };

          memories[updateIndex] = updatedMemory;
          saveMemories(memories);

          result = {
            action: "update",
            memory: updatedMemory,
            message: `Memory '${key}' updated successfully.`
          };
          break;

        case "delete":
          if (!key) {
            return {
              content: [
                {
                  type: "text",
                  text: "Error: 'key' is required for deleting a memory."
                }
              ]
            };
          }

          const deleteIndex = memories.findIndex(m => m.key === key);
          if (deleteIndex === -1) {
            return {
              content: [
                {
                  type: "text",
                  text: `Error: Memory with key '${key}' not found.`
                }
              ]
            };
          }

          const deletedMemory = memories.splice(deleteIndex, 1)[0];
          saveMemories(memories);

          result = {
            action: "delete",
            deleted_memory: deletedMemory,
            message: `Memory '${key}' deleted successfully.`
          };
          break;

        case "search":
          if (!search_query) {
            return {
              content: [
                {
                  type: "text",
                  text: "Error: 'search_query' is required for searching memories."
                }
              ]
            };
          }

          cleanupExpired();
          let searchResults = searchMemories(search_query);
          
          if (filter) {
            searchResults = applyFilters(searchResults, filter);
          }

          // Sort by importance and relevance
          searchResults.sort((a, b) => {
            const importanceOrder = { critical: 4, high: 3, medium: 2, low: 1 };
            const aImportance = importanceOrder[a.importance];
            const bImportance = importanceOrder[b.importance];
            
            if (aImportance !== bImportance) {
              return bImportance - aImportance;
            }
            
            return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
          });

          result = {
            action: "search",
            query: search_query,
            filter_applied: filter,
            total_matches: searchResults.length,
            memories: searchResults
          };
          break;

        case "list":
          cleanupExpired();
          let listedMemories = memories;
          
          if (filter) {
            listedMemories = applyFilters(listedMemories, filter);
          }

          // Sort by importance and update time
          listedMemories.sort((a, b) => {
            const importanceOrder = { critical: 4, high: 3, medium: 2, low: 1 };
            const aImportance = importanceOrder[a.importance];
            const bImportance = importanceOrder[b.importance];
            
            if (aImportance !== bImportance) {
              return bImportance - aImportance;
            }
            
            return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
          });

          result = {
            action: "list",
            total_memories: memories.length,
            filtered_memories: listedMemories.length,
            filter_applied: filter,
            memories: listedMemories,
            summary: {
              by_type: {
                fact: listedMemories.filter(m => m.type === "fact").length,
                preference: listedMemories.filter(m => m.type === "preference").length,
                context: listedMemories.filter(m => m.type === "context").length,
                learning: listedMemories.filter(m => m.type === "learning").length,
                temporary: listedMemories.filter(m => m.type === "temporary").length
              },
              by_importance: {
                critical: listedMemories.filter(m => m.importance === "critical").length,
                high: listedMemories.filter(m => m.importance === "high").length,
                medium: listedMemories.filter(m => m.importance === "medium").length,
                low: listedMemories.filter(m => m.importance === "low").length
              }
            }
          };
          break;

        case "cleanup":
          const expiredCount = cleanupExpired();
          saveMemories(memories);

          result = {
            action: "cleanup",
            expired_memories_removed: expiredCount,
            remaining_memories: memories.length,
            message: `Cleanup completed. Removed ${expiredCount} expired memories.`
          };
          break;

        default:
          return {
            content: [
              {
                type: "text",
                text: `Error: Unknown action '${action}'. Supported actions: store, retrieve, update, delete, search, list, cleanup`
              }
            ]
          };
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Error in memory store: ${error.message}`
          }
        ]
      };
    }
  });
};
