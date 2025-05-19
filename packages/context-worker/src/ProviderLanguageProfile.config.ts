import { Container } from 'inversify';

import { GolangProfile } from './code-context/go/GolangProfile';
import { JavaProfile } from './code-context/java/JavaProfile';
import { PythonProfile } from './code-context/python/PythonProfile';
import { RustProfile } from './code-context/rust/RustProfile';
import { TypeScriptProfile } from './code-context/typescript/TypeScriptProfile';
import { ILanguageProfile } from './ProviderTypes';
import { CSharpProfile } from './code-context/csharp/CSharpProfile';
import { KotlinProfile } from "./code-context/kotlin/KotlinProfile";
import { CProfile } from "./code-context/c/CProfile";
import { PHPProfile } from "./code-context/php/PHPProfile";

const languageContainer = new Container();

languageContainer.bind(ILanguageProfile).to(JavaProfile);
languageContainer.bind(ILanguageProfile).to(TypeScriptProfile);
languageContainer.bind(ILanguageProfile).to(GolangProfile);
languageContainer.bind(ILanguageProfile).to(PythonProfile);
languageContainer.bind(ILanguageProfile).to(CSharpProfile)
languageContainer.bind(ILanguageProfile).to(RustProfile);
languageContainer.bind(ILanguageProfile).to(KotlinProfile);
languageContainer.bind(ILanguageProfile).to(CProfile);
languageContainer.bind(ILanguageProfile).to(PHPProfile);

export { languageContainer };
