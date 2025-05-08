import { InstantiationService, providerContainer } from "./base/common/instantiation/instantiationService";
import { ILanguageServiceProvider, LanguageServiceProvider } from "./base/common/languages/languageService";
import { StructurerProviderManager } from "./code-context/StructurerProviderManager";
import { IStructurerProvider } from "./ProviderTypes";
import { JavaStructurerProvider } from "./code-context/java/JavaStructurerProvider";
import { TypeScriptStructurer } from "./code-context/typescript/TypeScriptStructurer";
import { GoStructurerProvider } from "./code-context/go/GoStructurerProvider";


const instantiationService = new InstantiationService();
instantiationService.registerSingleton(ILanguageServiceProvider, LanguageServiceProvider)

providerContainer.bind(IStructurerProvider).to(JavaStructurerProvider);
providerContainer.bind(IStructurerProvider).to(TypeScriptStructurer);
providerContainer.bind(IStructurerProvider).to(GoStructurerProvider);

async function main() {
	const languageServiceProvider = instantiationService.get(ILanguageServiceProvider);
	await languageServiceProvider.ready()
	console.log("Language service is ready");

	let structurer = StructurerProviderManager.getInstance().getStructurer("java");
	await structurer.init(languageServiceProvider)
	structurer.parseFile("public class Test { public void test() { System.out.println(\"Hello World\"); } }", "test.java").then((codeFile) => {
		console.log(JSON.stringify(codeFile));
	});
}

main().then(r => {});

