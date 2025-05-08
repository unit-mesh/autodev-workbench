import inquirer from "inquirer";
import { InstantiationService } from "./base/common/instantiation/instantiationService";
import { ILanguageServiceProvider, LanguageServiceProvider } from "./base/common/languages/languageService";


const instantiationService = new InstantiationService();
instantiationService.registerSingleton(ILanguageServiceProvider, LanguageServiceProvider)


inquirer
	.prompt({
		type: "input",
		name: "name",
		message: "What is your name?",
	})
	.then(async (answer) => {
		const instantiationService = new InstantiationService();
		instantiationService.registerSingleton(ILanguageServiceProvider, LanguageServiceProvider)

		const languageServiceProvider = instantiationService.get(ILanguageServiceProvider);
		let tree = await languageServiceProvider.parse('javascript', 'console.log("Hello, World!");');
		console.log(tree);
	});

