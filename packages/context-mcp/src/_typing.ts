export const Presets = [
    {
        name: "SafePosix",
        description: "SafePosix provides common posix commands as tools",
    },
    {
        name: "DevOps",
        description: "DevOps provides common devops commands as tools",
    },
    {
        name: "AutoDev",
        description: "AutoDev provides common auto dev commands as tools",
    }
] as const;

export type Preset = (typeof Presets)[number]["name"];