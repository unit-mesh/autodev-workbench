import { InstantiationService } from "./base/common/instantiation/instantiationService";
import { ILanguageServiceProvider, LanguageServiceProvider } from "./base/common/languages/languageService";


const instantiationService = new InstantiationService();
instantiationService.registerSingleton(ILanguageServiceProvider, LanguageServiceProvider)

async function main() {
	const languageServiceProvider = instantiationService.get(ILanguageServiceProvider);
	await languageServiceProvider.ready()
	console.log("Language service is ready");
	let tree = await languageServiceProvider.parse('javascript', 'console.log("Hello, World!");');
	console.log(tree);
}

main().then(r => {});

