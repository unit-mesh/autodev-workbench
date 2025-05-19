import { ToolLike } from "../../_typing";
import { z } from "zod";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export const installDfTool: ToolLike = (installer) => {
    installer("df", "Display disk space usage", {
        humanReadable: z.boolean().optional().describe("Display sizes in human readable format (e.g., 1K, 234M, 2G)"),
        local: z.boolean().optional().describe("List only local file systems"),
        type: z.string().optional().describe("Limit listing to file systems of specified type"),
        path: z.string().optional().describe("Show information for the file system containing the specified path"),
    }, async ({ humanReadable, local, type, path }) => {
        try {
            // Get disk information using system commands
            const { stdout: diskInfo } = await execAsync('wmic logicaldisk get deviceid,size,freespace,drivetype /format:list');
            
            // Parse disk information
            const disks = diskInfo.split('\n\n').filter(Boolean).map(disk => {
                const lines = disk.split('\n').filter(Boolean);
                const deviceId = lines.find(line => line.includes('DeviceID'))?.split('=')[1] || '';
                const size = parseInt(lines.find(line => line.includes('Size'))?.split('=')[1] || '0');
                const freeSpace = parseInt(lines.find(line => line.includes('FreeSpace'))?.split('=')[1] || '0');
                const driveType = parseInt(lines.find(line => line.includes('DriveType'))?.split('=')[1] || '0');
                
                return {
                    deviceId,
                    size,
                    freeSpace,
                    usedSpace: size - freeSpace,
                    driveType
                };
            });

            // Filter disks based on options
            let filteredDisks = disks;
            if (local) {
                filteredDisks = disks.filter(disk => disk.driveType === 3); // Local fixed disk
            }
            if (type) {
                filteredDisks = disks.filter(disk => disk.driveType.toString() === type);
            }
            if (path) {
                const driveLetter = path.charAt(0).toUpperCase();
                filteredDisks = disks.filter(disk => disk.deviceId === driveLetter);
            }

            // Format numbers
            function formatSize(bytes: number): string {
                if (humanReadable) {
                    const units = ['B', 'K', 'M', 'G', 'T'];
                    let size = bytes;
                    let unitIndex = 0;
                    while (size >= 1024 && unitIndex < units.length - 1) {
                        size /= 1024;
                        unitIndex++;
                    }
                    return `${size.toFixed(1)}${units[unitIndex]}`;
                }
                return bytes.toString();
            }

            // Calculate percentage
            function calculatePercentage(used: number, total: number): string {
                return total === 0 ? '0%' : `${Math.round((used / total) * 100)}%`;
            }

            // Build output
            const output = [
                'Filesystem      Size    Used    Avail Use% Mounted on'
            ];

            for (const disk of filteredDisks) {
                const usePercent = calculatePercentage(disk.usedSpace, disk.size);
                output.push(
                    `${disk.deviceId}:\\        ${formatSize(disk.size)}  ${formatSize(disk.usedSpace)}  ${formatSize(disk.freeSpace)}  ${usePercent}  /`
                );
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
                        text: `Error getting disk information: ${error.message}`
                    }
                ]
            };
        }
    });
}; 