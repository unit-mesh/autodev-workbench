import { AppConfig } from "./types/AppConfig";
import { CommandLineParser, UserInputHandler } from "./cli/cli";
import { InterfaceAnalyzerApp } from "./analyzer/InterfaceAnalyzerApp";

async function run(options?: Partial<AppConfig>): Promise<void> {
	const commandLineParser = new CommandLineParser();
	const userInputHandler = new UserInputHandler();

	const cmdConfig = commandLineParser.parse();
	const initialConfig: AppConfig = {
		...cmdConfig,
		...options,
	};

	let config = initialConfig;
	const isDefaultPath = cmdConfig.dirPath === process.cwd();
	const shouldPrompt = !config.nonInteractive && (isDefaultPath && !options?.dirPath);

	if (shouldPrompt) {
		config = await userInputHandler.getAppConfig(config);
	}

	const app = new InterfaceAnalyzerApp(config);
	console.info('config:', config);

	// 根据分析类型配置运行不同的分析
	if (config.analysisTypes.interface) {
		console.log('正在运行接口分析...');
		await app.handleInterfaceContext();
	} else {
		await app.handleInterfaceContext(false);
	}

	if (config.analysisTypes.api) {
		console.log('正在运行API分析...');
		await app.handleHttpApiContext();
	}

	if (config.analysisTypes.symbol) {
		console.log('正在运行符号分析...');
		await app.handleSymbolContext();
	}

	if (!config.analysisTypes.interface && !config.analysisTypes.api && !config.analysisTypes.symbol) {
		console.log('没有选择任何分析类型，默认运行所有分析...');
		await app.handleInterfaceContext();
		await app.handleHttpApiContext();
		await app.handleSymbolContext();
	}
}

if (require.main === module) {
	run().catch(err => console.error("错误:", err));
} else {
	module.exports = { main: run };
}
