import * as fs from 'fs';
import { ProtoAnalyser } from './ProtoAnalyser';
import { CodeDataStruct, listFiles } from '@autodev/worker-core';

export interface AnalysisResult {
	filePath: string;
	dataStructures: CodeDataStruct[];
}

/**
 * 扫描目录下的所有 .proto 文件
 * @param dirPath 要扫描的目录路径
 * @returns .proto 文件路径数组
 */
export async function scanProtoFiles(dirPath: string): Promise<string[]> {
	const protoFiles: string[] = [];
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [files, limit] = await listFiles(dirPath, true, 99999);
	for (const file of files) {
		if (file.endsWith('.proto')) {
			protoFiles.push(file);
		}
	}

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
		try {
			const content = fs.readFileSync(filePath, 'utf-8');
			const dataStructures = analyser.analyseFromContent(content, filePath);
			results.push({ filePath, dataStructures });
		} catch (e) {
			console.error(`Failed to read or parse file ${filePath}:`, e);
		}
	}

	return results;
}

// async function main() {
// 	const dirPath = process.argv[2] || '.'; // 默认扫描 ./protos 目录
// 	const protoFiles = await scanProtoFiles(dirPath);
// 	const results = await analyseProtos(protoFiles);
// 	console.log(JSON.stringify(results, null, 2));
// 	// save to file
// 	const outputFilePath = path.join(process.cwd(), 'analysis_result.json');
// 	fs.writeFileSync(outputFilePath, JSON.stringify(results, null, 2));
//
// 	const resourceAnalyser = new ProtoApiResourceGenerator();
// 	const apiResources = resourceAnalyser.generateApiResources(results.flatMap(result => result.dataStructures));
// 	console.log(JSON.stringify(apiResources, null, 2));
// 	// save to file
// 	const apiOutputFilePath = path.join(process.cwd(), 'api_resources.json');
// 	fs.writeFileSync(apiOutputFilePath, JSON.stringify(apiResources, null, 2));
// }
//
// main().catch((error) => {
// 	console.error('Error:', error);
// });
