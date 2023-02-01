import { expandToStringWithNL, Generated } from "langium";
import { ClassDeclaration } from "../../../language-server/generated/ast";
import { capitalizeString } from "../generator-utils";

function classAttributes(cls: ClassDeclaration) : Generated {
    return cls.attributes.map(a => `@NotBlank ${capitalizeString(a.attributeType ?? 'NOTYPE')} ${a.name}`).join(',\n')
}

export function generateInputDTO(cls: ClassDeclaration, package_name: string) : Generated {
    return expandToStringWithNL`
        package ${package_name}.dtos;

        import javax.validation.constraints.NotBlank;
        import io.micronaut.core.annotation.Introspected;

        @Introspected
        public record ${cls.name}InputDto(
            ${classAttributes(cls)}
        ) {}
    `
}

export function generateOutputDTO(cls: ClassDeclaration, package_name: string) : Generated {
    return expandToStringWithNL`
        package ${package_name}.dtos;

        import java.util.UUID;
        // import java.time.LocalDateTime;
        // import javax.validation.constraints.NotNull;
        import javax.validation.constraints.NotBlank;
        // import javax.validation.constraints.PastOrPresent;

        public record ${cls.name}OutputDto(
            @NotBlank UUID id,
            ${classAttributes(cls)}
            // @PastOrPresent @NotNull LocalDateTime createdAt
        ) {}
    `
}