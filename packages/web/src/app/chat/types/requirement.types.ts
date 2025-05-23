import { ApiResource, CodeAnalysis, Guideline } from "@/types/project.type";

export interface RequirementCard {
  name: string;
  module: string;
  description: string;
  apis: ApiResource[];
  codeSnippets: CodeAnalysis[];
  guidelines: Guideline[];
  assignee: string;
  deadline: string;
  status: "draft" | "pending" | "approved";
}

export type EditableRequirementCardField = "name" | "module" | "description" | "assignee" | "deadline";
