import { CompositeGeneratorNode, expandToStringWithNL, Generated } from "langium";
import { ClassDeclaration } from "../../../language-server/generated/ast";
import { capitalizeString } from "../generator-utils";
import { RelationInfo } from "./relations";

function classAttributes(cls: ClassDeclaration) : Generated {
  return cls.attributes.map(a => `${capitalizeString(a.attributeType ?? 'NOTYPE')} ${a.name},`).join('\n')
}

export function generateInputDTO(cls: ClassDeclaration, relations: RelationInfo[], package_name: string) : Generated {
  return expandToStringWithNL`
    package ${package_name}.dtos;

    import java.util.UUID;
    // import javax.validation.constraints.NotBlank;
    import io.micronaut.core.annotation.Introspected;

    @Introspected
    public record ${cls.name}InputDto(
        ${classAttributes(cls)}
        ${processInputRelations(relations)}
    ) {}
  `
}

function processInputRelations(relations: RelationInfo[]) : Generated {
  return getInputRelations(relations).map(
    r => `UUID ${r.tgt.name.toLowerCase()}_id`
  ).join(',\n')
}

export function generateOutputDTO(cls: ClassDeclaration, relations: RelationInfo[], package_name: string) : Generated {
  return expandToStringWithNL`
    package ${package_name}.dtos;

    import java.util.List;
    import java.util.UUID;
    import java.time.LocalDateTime;
    // import javax.validation.constraints.NotNull;
    import javax.validation.constraints.NotBlank;
    // import javax.validation.constraints.PastOrPresent;

    public record ${cls.name}OutputDto(
        @NotBlank UUID id,
        ${classAttributes(cls)}
        ${processOutputRelations(relations)}
        LocalDateTime createdAt
    ) {}
  `
}

function processOutputRelations(relations: RelationInfo[]) : Generated {
  const node = new CompositeGeneratorNode()

  for(const {tgt, card} of getOutputRelations(relations)) {
    switch (card) {
    case "OneToOne":
    case "ManyToOne":
      node.append(`UUID ${tgt.name.toLowerCase()}_id,`)
      break;
    case "OneToMany":
    case "ManyToMany":
      node.append(`List<UUID> ${tgt.name.toLowerCase()}_ids,`)
      break
    }
    node.appendNewLine()
  }

  return node
}

/**
 * Dada uma lista de RelationInfo, retorna a lista de quais dessas relações são passadas no InputDTO.
 */
export function getInputRelations(relations: RelationInfo[]) : RelationInfo[] {
  return relations.filter(r => r.owner && (r.card === 'ManyToOne' || r.card === "OneToOne"))
}

/**
 * Dada uma lista de RelationInfo, retorna a lista de quais dessas relações são passadas no OutputDTO.
 * 
 * No momento, isso se resume a "qualquer relação exceto OneToOne que você não é dono", pois pode ser um null pointer
 */
export function getOutputRelations(relations: RelationInfo[]) : RelationInfo[] {
  return relations.filter(r => r.owner || !(r.card === "OneToOne"))
}
