import { ToolLike } from "../_typing";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";

interface Task {
  id: string;
  title: string;
  description: string;
  status: "pending" | "in_progress" | "completed" | "blocked" | "cancelled";
  priority: "low" | "medium" | "high" | "critical";
  created_at: string;
  updated_at: string;
  due_date?: string;
  dependencies?: string[];
  tags?: string[];
  assignee?: string;
  estimated_time?: number; // in minutes
  actual_time?: number; // in minutes
  notes?: string[];
}

export const installTaskPlannerTool: ToolLike = (installer) => {
  installer("task-planner", "Manage tasks and project planning with dependencies and tracking", {
    action: z.enum(["create", "update", "list", "get", "delete", "plan", "analyze"]).describe("Action to perform"),
    task_id: z.string().optional().describe("Task ID (required for update, get, delete actions)"),
    title: z.string().optional().describe("Task title (required for create)"),
    description: z.string().optional().describe("Task description"),
    status: z.enum(["pending", "in_progress", "completed", "blocked", "cancelled"]).optional().describe("Task status"),
    priority: z.enum(["low", "medium", "high", "critical"]).optional().describe("Task priority"),
    due_date: z.string().optional().describe("Due date (ISO format)"),
    dependencies: z.array(z.string()).optional().describe("Array of task IDs this task depends on"),
    tags: z.array(z.string()).optional().describe("Tags for categorization"),
    assignee: z.string().optional().describe("Person assigned to the task"),
    estimated_time: z.number().optional().describe("Estimated time in minutes"),
    actual_time: z.number().optional().describe("Actual time spent in minutes"),
    notes: z.string().optional().describe("Additional notes to add"),
    filter: z.object({
      status: z.array(z.string()).optional(),
      priority: z.array(z.string()).optional(),
      tags: z.array(z.string()).optional(),
      assignee: z.string().optional()
    }).optional().describe("Filters for list action")
  }, async ({ 
    action,
    task_id,
    title,
    description,
    status,
    priority,
    due_date,
    dependencies,
    tags,
    assignee,
    estimated_time,
    actual_time,
    notes,
    filter
  }: { 
    action: "create" | "update" | "list" | "get" | "delete" | "plan" | "analyze";
    task_id?: string;
    title?: string;
    description?: string;
    status?: "pending" | "in_progress" | "completed" | "blocked" | "cancelled";
    priority?: "low" | "medium" | "high" | "critical";
    due_date?: string;
    dependencies?: string[];
    tags?: string[];
    assignee?: string;
    estimated_time?: number;
    actual_time?: number;
    notes?: string;
    filter?: {
      status?: string[];
      priority?: string[];
      tags?: string[];
      assignee?: string;
    };
  }) => {
    try {
      // Get tasks file path
      const workspacePath = process.env.WORKSPACE_PATH || process.cwd();
      const tasksFilePath = path.join(workspacePath, '.autodev', 'tasks.json');
      
      // Ensure .autodev directory exists
      const autodirPath = path.dirname(tasksFilePath);
      if (!fs.existsSync(autodirPath)) {
        fs.mkdirSync(autodirPath, { recursive: true });
      }

      // Load existing tasks
      let tasks: Task[] = [];
      if (fs.existsSync(tasksFilePath)) {
        try {
          const tasksData = fs.readFileSync(tasksFilePath, 'utf8');
          tasks = JSON.parse(tasksData);
        } catch (error) {
          console.warn('Warning: Could not parse existing tasks file, starting fresh');
        }
      }

      // Generate unique ID
      function generateId(): string {
        return 'task_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
      }

      // Save tasks to file
      function saveTasks(tasks: Task[]): void {
        fs.writeFileSync(tasksFilePath, JSON.stringify(tasks, null, 2));
      }

      let result: any = {};

      switch (action) {
        case "create":
          if (!title) {
            return {
              content: [
                {
                  type: "text",
                  text: "Error: 'title' is required for creating a task."
                }
              ]
            };
          }

          const newTask: Task = {
            id: generateId(),
            title: title,
            description: description || "",
            status: status || "pending",
            priority: priority || "medium",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            due_date: due_date,
            dependencies: dependencies || [],
            tags: tags || [],
            assignee: assignee,
            estimated_time: estimated_time,
            actual_time: actual_time,
            notes: notes ? [notes] : []
          };

          tasks.push(newTask);
          saveTasks(tasks);

          result = {
            action: "create",
            task: newTask,
            message: `Task '${title}' created successfully with ID: ${newTask.id}`
          };
          break;

        case "update":
          if (!task_id) {
            return {
              content: [
                {
                  type: "text",
                  text: "Error: 'task_id' is required for updating a task."
                }
              ]
            };
          }

          const taskIndex = tasks.findIndex(t => t.id === task_id);
          if (taskIndex === -1) {
            return {
              content: [
                {
                  type: "text",
                  text: `Error: Task with ID '${task_id}' not found.`
                }
              ]
            };
          }

          const existingTask = tasks[taskIndex];
          const updatedTask: Task = {
            ...existingTask,
            title: title || existingTask.title,
            description: description !== undefined ? description : existingTask.description,
            status: status || existingTask.status,
            priority: priority || existingTask.priority,
            due_date: due_date !== undefined ? due_date : existingTask.due_date,
            dependencies: dependencies || existingTask.dependencies,
            tags: tags || existingTask.tags,
            assignee: assignee !== undefined ? assignee : existingTask.assignee,
            estimated_time: estimated_time !== undefined ? estimated_time : existingTask.estimated_time,
            actual_time: actual_time !== undefined ? actual_time : existingTask.actual_time,
            updated_at: new Date().toISOString(),
            notes: notes ? [...(existingTask.notes || []), notes] : existingTask.notes
          };

          tasks[taskIndex] = updatedTask;
          saveTasks(tasks);

          result = {
            action: "update",
            task: updatedTask,
            message: `Task '${updatedTask.title}' updated successfully.`
          };
          break;

        case "get":
          if (!task_id) {
            return {
              content: [
                {
                  type: "text",
                  text: "Error: 'task_id' is required for getting a task."
                }
              ]
            };
          }

          const task = tasks.find(t => t.id === task_id);
          if (!task) {
            return {
              content: [
                {
                  type: "text",
                  text: `Error: Task with ID '${task_id}' not found.`
                }
              ]
            };
          }

          result = {
            action: "get",
            task: task
          };
          break;

        case "list":
          let filteredTasks = tasks;

          if (filter) {
            if (filter.status && filter.status.length > 0) {
              filteredTasks = filteredTasks.filter(t => filter.status!.includes(t.status));
            }
            if (filter.priority && filter.priority.length > 0) {
              filteredTasks = filteredTasks.filter(t => filter.priority!.includes(t.priority));
            }
            if (filter.tags && filter.tags.length > 0) {
              filteredTasks = filteredTasks.filter(t => 
                filter.tags!.some(tag => t.tags?.includes(tag))
              );
            }
            if (filter.assignee) {
              filteredTasks = filteredTasks.filter(t => t.assignee === filter.assignee);
            }
          }

          // Sort by priority and due date
          filteredTasks.sort((a, b) => {
            const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
            const aPriority = priorityOrder[a.priority];
            const bPriority = priorityOrder[b.priority];
            
            if (aPriority !== bPriority) {
              return bPriority - aPriority;
            }
            
            if (a.due_date && b.due_date) {
              return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
            }
            
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          });

          result = {
            action: "list",
            total_tasks: tasks.length,
            filtered_tasks: filteredTasks.length,
            filter_applied: filter,
            tasks: filteredTasks,
            summary: {
              by_status: {
                pending: filteredTasks.filter(t => t.status === "pending").length,
                in_progress: filteredTasks.filter(t => t.status === "in_progress").length,
                completed: filteredTasks.filter(t => t.status === "completed").length,
                blocked: filteredTasks.filter(t => t.status === "blocked").length,
                cancelled: filteredTasks.filter(t => t.status === "cancelled").length
              },
              by_priority: {
                critical: filteredTasks.filter(t => t.priority === "critical").length,
                high: filteredTasks.filter(t => t.priority === "high").length,
                medium: filteredTasks.filter(t => t.priority === "medium").length,
                low: filteredTasks.filter(t => t.priority === "low").length
              }
            }
          };
          break;

        case "delete":
          if (!task_id) {
            return {
              content: [
                {
                  type: "text",
                  text: "Error: 'task_id' is required for deleting a task."
                }
              ]
            };
          }

          const deleteIndex = tasks.findIndex(t => t.id === task_id);
          if (deleteIndex === -1) {
            return {
              content: [
                {
                  type: "text",
                  text: `Error: Task with ID '${task_id}' not found.`
                }
              ]
            };
          }

          const deletedTask = tasks.splice(deleteIndex, 1)[0];
          saveTasks(tasks);

          result = {
            action: "delete",
            deleted_task: deletedTask,
            message: `Task '${deletedTask.title}' deleted successfully.`
          };
          break;

        case "plan":
          // Generate project plan based on tasks
          const activeTasks = tasks.filter(t => t.status !== "completed" && t.status !== "cancelled");
          
          // Build dependency graph
          const dependencyMap = new Map<string, string[]>();
          activeTasks.forEach(task => {
            dependencyMap.set(task.id, task.dependencies || []);
          });

          // Topological sort for task ordering
          function topologicalSort(tasks: Task[]): Task[] {
            const visited = new Set<string>();
            const visiting = new Set<string>();
            const result: Task[] = [];

            function visit(taskId: string): void {
              if (visiting.has(taskId)) {
                throw new Error(`Circular dependency detected involving task ${taskId}`);
              }
              if (visited.has(taskId)) return;

              visiting.add(taskId);
              const dependencies = dependencyMap.get(taskId) || [];
              dependencies.forEach(depId => visit(depId));
              visiting.delete(taskId);
              visited.add(taskId);

              const task = tasks.find(t => t.id === taskId);
              if (task) result.push(task);
            }

            tasks.forEach(task => {
              if (!visited.has(task.id)) {
                visit(task.id);
              }
            });

            return result;
          }

          try {
            const orderedTasks = topologicalSort(activeTasks);
            const totalEstimatedTime = orderedTasks.reduce((sum, task) => sum + (task.estimated_time || 0), 0);

            result = {
              action: "plan",
              total_active_tasks: activeTasks.length,
              total_estimated_time_minutes: totalEstimatedTime,
              total_estimated_time_hours: Math.round(totalEstimatedTime / 60 * 100) / 100,
              execution_order: orderedTasks.map((task, index) => ({
                order: index + 1,
                id: task.id,
                title: task.title,
                priority: task.priority,
                estimated_time: task.estimated_time,
                dependencies: task.dependencies,
                due_date: task.due_date
              })),
              critical_path: orderedTasks.filter(t => t.priority === "critical" || t.priority === "high"),
              blocked_tasks: activeTasks.filter(t => t.status === "blocked")
            };
          } catch (error: any) {
            result = {
              action: "plan",
              error: error.message,
              tasks_with_issues: activeTasks.map(t => ({ id: t.id, title: t.title, dependencies: t.dependencies }))
            };
          }
          break;

        case "analyze":
          // Analyze task performance and patterns
          const completedTasks = tasks.filter(t => t.status === "completed");
          const overdueTasks = tasks.filter(t => 
            t.due_date && new Date(t.due_date) < new Date() && t.status !== "completed"
          );

          const avgCompletionTime = completedTasks.length > 0 
            ? completedTasks.reduce((sum, task) => sum + (task.actual_time || 0), 0) / completedTasks.length
            : 0;

          result = {
            action: "analyze",
            total_tasks: tasks.length,
            completed_tasks: completedTasks.length,
            completion_rate: tasks.length > 0 ? Math.round(completedTasks.length / tasks.length * 100) : 0,
            overdue_tasks: overdueTasks.length,
            average_completion_time_minutes: Math.round(avgCompletionTime),
            task_distribution: {
              by_status: {
                pending: tasks.filter(t => t.status === "pending").length,
                in_progress: tasks.filter(t => t.status === "in_progress").length,
                completed: tasks.filter(t => t.status === "completed").length,
                blocked: tasks.filter(t => t.status === "blocked").length,
                cancelled: tasks.filter(t => t.status === "cancelled").length
              },
              by_priority: {
                critical: tasks.filter(t => t.priority === "critical").length,
                high: tasks.filter(t => t.priority === "high").length,
                medium: tasks.filter(t => t.priority === "medium").length,
                low: tasks.filter(t => t.priority === "low").length
              }
            },
            recommendations: [
              overdueTasks.length > 0 ? `${overdueTasks.length} tasks are overdue and need attention` : null,
              tasks.filter(t => t.status === "blocked").length > 0 ? "Some tasks are blocked and may need dependency resolution" : null,
              completedTasks.length === 0 ? "No completed tasks yet - consider breaking down large tasks" : null
            ].filter(Boolean)
          };
          break;

        default:
          return {
            content: [
              {
                type: "text",
                text: `Error: Unknown action '${action}'. Supported actions: create, update, list, get, delete, plan, analyze`
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
            text: `Error in task planner: ${error.message}`
          }
        ]
      };
    }
  });
};
