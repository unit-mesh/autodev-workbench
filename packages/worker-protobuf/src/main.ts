import * as fs from 'fs';
import * as path from 'path';
import { ProtoAnalyser } from './ProtoAnalyser';
import { CodeDataStruct } from "./ProtoAnalyser.type";

export interface AnalysisResult {
    filePath: string;
    dataStructures: CodeDataStruct[];
}

/**
 * 扫描目录下的所有 .proto 文件
 * @param dirPath 要扫描的目录路径
 * @returns .proto 文件路径数组
 */
export function scanProtoFiles(dirPath: string): string[] {
    const protoFiles: string[] = [];

    function scanDirectory(directory: string) {
        const files = fs.readdirSync(directory);

        for (const file of files) {
            const fullPath = path.join(directory, file);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                scanDirectory(fullPath);
            } else if (file.endsWith('.proto')) {
                protoFiles.push(fullPath);
            }
        }
    }

    scanDirectory(dirPath);
    return protoFiles;
}

/**
 * 分析所有 .proto 文件并合并结果
 * @param protoFiles .proto 文件路径数组
 * @returns 合并后的分析结果
 */
export async function analyseProtos(protoFiles: string[]): Promise<AnalysisResult[]> {
    const analyser = new ProtoAnalyser();
    const results: AnalysisResult[] = [];

    for (const filePath of protoFiles) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const dataStructures = analyser.analyseFromContent(content, filePath);
        results.push({ filePath, dataStructures });
    }

    return results;
}

async function main() {
    const dirPath = process.argv[2] || '.'; // 默认扫描 ./protos 目录
    const protoFiles = scanProtoFiles(dirPath);
    const results = await analyseProtos(protoFiles);
    console.log(JSON.stringify(results, null, 2));
    // save to file
    const outputFilePath = path.join(process.cwd(), 'analysis_result.json');
    fs.writeFileSync(outputFilePath, JSON.stringify(results, null, 2));
}

main().catch((error) => {
    console.error('Error:', error);
});
