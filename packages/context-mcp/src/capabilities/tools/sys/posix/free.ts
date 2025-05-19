import { ToolLike } from "../../_typing";
import { z } from "zod";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export const installFreeTool: ToolLike = (installer) => {
    installer("free", "Display amount of free and used memory in the system", {
        humanReadable: z.boolean().optional().describe("Display sizes in human readable format (e.g., 1K, 234M, 2G)"),
        total: z.boolean().optional().describe("Display the total sum of columns"),
        wide: z.boolean().optional().describe("Wide output format"),
    }, async ({ humanReadable, total, wide }) => {
        try {
            // Get memory information using system commands
            const { stdout: memInfo } = await execAsync('wmic OS get FreePhysicalMemory,TotalVisibleMemorySize /Value');
            const { stdout: swapInfo } = await execAsync('wmic pagefileset get CurrentUsage,AllocatedBaseSize /Value');

            // Parse memory information
            const memLines = memInfo.split('\n').filter(Boolean);
            const swapLines = swapInfo.split('\n').filter(Boolean);

            const freeMem = parseInt(memLines.find(line => line.includes('FreePhysicalMemory'))?.split('=')[1] || '0');
            const totalMem = parseInt(memLines.find(line => line.includes('TotalVisibleMemorySize'))?.split('=')[1] || '0');
            const usedMem = totalMem - freeMem;

            const swapUsed = parseInt(swapLines.find(line => line.includes('CurrentUsage'))?.split('=')[1] || '0');
            const swapTotal = parseInt(swapLines.find(line => line.includes('AllocatedBaseSize'))?.split('=')[1] || '0');
            const swapFree = swapTotal - swapUsed;

            // Format numbers
            function formatSize(bytes: number): string {
                if (humanReadable) {
                    const units = ['B', 'K', 'M', 'G', 'T'];
                    let size = bytes * 1024; // Convert to bytes
                    let unitIndex = 0;
                    while (size >= 1024 && unitIndex < units.length - 1) {
                        size /= 1024;
                        unitIndex++;
                    }
                    return `${size.toFixed(1)}${units[unitIndex]}`;
                }
                return bytes.toString();
            }

            // Build output
            const output = [
                '              total        used        free      shared  buff/cache   available',
                `Mem:    ${formatSize(totalMem)}  ${formatSize(usedMem)}  ${formatSize(freeMem)}         0         0  ${formatSize(freeMem)}`,
                `Swap:   ${formatSize(swapTotal)}  ${formatSize(swapUsed)}  ${formatSize(swapFree)}`
            ];

            if (total) {
                const grandTotal = totalMem + swapTotal;
                const grandUsed = usedMem + swapUsed;
                const grandFree = freeMem + swapFree;
                output.push(`Total:  ${formatSize(grandTotal)}  ${formatSize(grandUsed)}  ${formatSize(grandFree)}`);
            }

            return {
                content: [
                    {
                        type: "text",
                        text: output.join('\n')
                    }
                ]
            };
        } catch (error: any) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Error getting memory information: ${error.message}`
                    }
                ]
            };
        }
    });
}; 