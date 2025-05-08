/* eslint-disable @typescript-eslint/naming-convention */
/**
 * The PROVIDER_TYPES object is a collection of string constants that represent different types of providers
 * in the system. Each property in the object corresponds to a specific provider type.
 */
import { type interfaces } from 'inversify';
import { LanguageProfile } from "./code-context/base/LanguageProfile";
import { RelevantCodeProvider } from "./code-context/base/RelevantCodeProvider";
import { StructurerProvider } from "./code-context/base/StructurerProvider";

export const ILanguageProfile: interfaces.ServiceIdentifier<LanguageProfile> = Symbol('LanguageProfile');

export const IRelevantCodeProvider: interfaces.ServiceIdentifier<RelevantCodeProvider> = Symbol('RelevantCodeProvider');

/**
 * Code structure analysis, parse source code to structure data
 * see in {@link StructurerProvider#parseFile}
 * structure data for {@link CodeElement} which can be {@link CodeFile}, {@link CodeFunction}, {@link CodeVariable}
 */
export const IStructurerProvider: interfaces.ServiceIdentifier<StructurerProvider> = Symbol('IStructurerProvider');
