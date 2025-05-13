import * as path from 'path';
import { AppConfig } from "./types/AppConfig";
import { CommandLineParser, UserInputHandler } from "./cli/cli";
import { InterfaceAnalyzerApp } from "./analyzer/InterfaceAnalyzerApp";

async function run(options?: Partial<AppConfig>): Promise<void> {
    const commandLineParser = new CommandLineParser();
    const userInputHandler = new UserInputHandler();
    const app = new InterfaceAnalyzerApp();

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

    await app.run(config);
}

if (require.main === module) {
    run().catch(err => console.error("错误:", err));
} else {
    module.exports = { main: run };
}
