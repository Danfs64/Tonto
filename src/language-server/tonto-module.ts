import { TontoFormatter } from './tonto-formatter';
import {
    createDefaultModule, createDefaultSharedModule, DefaultSharedModuleContext, inject,
    LangiumServices, LangiumSharedServices, Module, PartialLangiumServices
} from 'langium';
import { TontoGeneratedModule, TontoGeneratedSharedModule } from './generated/module';
import { TontoActionProvider } from './tonto-code-actions';
import { TontoDescriptionProvider } from './tonto-index';
import { TontoNameProvider } from './tonto-naming';
import { TontoScopeComputation } from './tonto-scope';
import { TontoValidationRegistry } from './tonto-validator';
import { TontoValidator } from './validators/TontoValidator';

/**
 * Declaration of custom services - add your own service classes here.
 */
export type TontoAddedServices = {
    validation: {
        TontoValidator: TontoValidator
    },
}

/**
 * Union of Langium default services and your custom services - use this as constructor parameter
 * of custom service classes.
 */
export type TontoServices = LangiumServices & TontoAddedServices

/**
 * Dependency injection module that overrides Langium default services and contributes the
 * declared custom services. The Langium defaults can be partially specified to override only
 * selected services, while the custom services must be fully specified.
 */
export const TontoModule: Module<TontoServices, PartialLangiumServices & TontoAddedServices> = {

    references: {
        ScopeComputation: (services) => new TontoScopeComputation(services),
        NameProvider: () => new TontoNameProvider(),
        // ScopeProvider: (services) => new TontoScopeProvider(services),
    },
    validation: {
        ValidationRegistry: (services) => new TontoValidationRegistry(services),
        TontoValidator: () => new TontoValidator(),
    },
    workspace: {
        AstNodeDescriptionProvider: (services: TontoServices) => new TontoDescriptionProvider(services)
    },
    lsp: {
        CodeActionProvider: () => new TontoActionProvider(),
        Formatter: () => new TontoFormatter(),
    }
};

/**
 * Create the full set of services required by Langium.
 *
 * First inject the shared services by merging two modules:
 *  - Langium default shared services
 *  - Services generated by langium-cli
 *
 * Then inject the language-specific services by merging three modules:
 *  - Langium default language-specific services
 *  - Services generated by langium-cli
 *  - Services specified in this file
 *
 * @param context Optional module context with the LSP connection
 * @returns An object wrapping the shared services and the language-specific services
 */
export function createTontoServices(context?: DefaultSharedModuleContext): {
    shared: LangiumSharedServices,
    Tonto: TontoServices
} {
    const shared = inject(
        createDefaultSharedModule(context),
        TontoGeneratedSharedModule
    );
    const Tonto = inject(
        createDefaultModule({ shared }),
        TontoGeneratedModule,
        TontoModule
    );
    shared.ServiceRegistry.register(Tonto);
    return { shared, Tonto };
}
