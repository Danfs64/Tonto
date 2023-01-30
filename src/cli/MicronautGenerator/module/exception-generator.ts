import { expandToStringWithNL, Generated } from "langium"
import { ClassDeclaration } from "../../../language-server/generated/ast"

export function generateNotFoundException(package_name: string) : Generated {
    return expandToStringWithNL`
        package ${package_name}.exceptions;

        public class NotFoundException extends RuntimeException {
            public NotFoundException(String str) {
                super(str);
            }
        }
    `
}

export function generateNotFoundHandler(package_name: string) : Generated {
    return expandToStringWithNL`
        package ${package_name}.exceptions;

        import jakarta.inject.Singleton;
        import lombok.RequiredArgsConstructor;
        import io.micronaut.context.annotation.Requires;
        import io.micronaut.http.HttpRequest;
        import io.micronaut.http.HttpResponse;
        import io.micronaut.http.annotation.Produces;
        import io.micronaut.http.server.exceptions.ExceptionHandler;
        import io.micronaut.http.server.exceptions.response.ErrorContext;
        import io.micronaut.http.server.exceptions.response.ErrorResponseProcessor;

        @Produces
        @Singleton
        @Requires(classes = { NotFoundException.class })
        @RequiredArgsConstructor
        public class NotFoundHandler implements ExceptionHandler<NotFoundException, HttpResponse<?>> {
            private final ErrorResponseProcessor<?> errorResponseProcessor;
        
            @Override
            public HttpResponse<?> handle(HttpRequest request, NotFoundException exception) {
                return errorResponseProcessor.processResponse(
                    ErrorContext.builder(request)
                        .cause(exception)
                        .errorMessage(exception.getMessage())
                        .build(),
                    HttpResponse.notFound()
                );
            }
        }
    `
}

export function generateClassNotFoundException(cls: ClassDeclaration, package_name: string) : Generated {
    return expandToStringWithNL`
        package ${package_name}.exceptions;

        import java.util.UUID;

        public class ${cls.name}NotFoundException extends NotFoundException {
            public ${cls.name}NotFoundException(UUID id) {
                super("${cls.name} [id = "+id+"] was not found");
            }
        }
    `
}
