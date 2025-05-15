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
	if (config.contextType === 'interface') {
		await app.handleInterfaceContext();
		await app.handleApiContext();
	} else {
		await app.handleApiContext();
	}
}

if (require.main === module) {
	run().catch(err => console.error("错误:", err));
} else {
	module.exports = { main: run };
}
