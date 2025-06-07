import { z } from "zod";

export type ToolLike = (
  installer: (
    name: string,
    description: string,
    inputSchema: Record<string, z.ZodType>,
    handler: (args: any) => Promise<{
      content: Array<{
        type: "text" | "image" | "resource";
        text?: string;
        data?: string;
        mimeType?: string;
      }>;
    }>
  ) => void
) => void;
