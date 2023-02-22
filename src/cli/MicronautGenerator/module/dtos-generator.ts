import { expandToStringWithNL, Generated, toString } from "langium";
import { Attribute, ClassDeclaration } from "../../../language-server/generated/ast";
import { capitalizeString } from "../generator-utils";
import { RelationInfo } from "./relations";

function processAttributes(attrs: Attribute[]) : Generated[] {
  return attrs.map(a => `${capitalizeString(a.attributeType ?? 'NOTYPE')} ${a.name}`)
}

function processRelations(relations: RelationInfo[]) : Generated[] {
  return relations.map(r => {
    if(r.card === "ManyToMany" || r.card === "OneToMany") {
      return `List<UUID> ${r.tgt.name.toLowerCase()}_ids`
    } else {
      return `UUID ${r.tgt.name.toLowerCase()}_id`
    }
  })
}

export function generateInputDTO(cls: ClassDeclaration, attributes: Attribute[], relations: RelationInfo[], package_name: string) : Generated {
  const attrs_str = processAttributes(attributes)
  const rels_str = processRelations(getInputRelations(relations))
  return expandToStringWithNL`
    package ${package_name}.dtos;

    import java.util.List;
    import java.util.UUID;
    // import javax.validation.constraints.NotBlank;
    import io.micronaut.core.annotation.Introspected;

    @Introspected
    public record ${cls.name}InputDto(
        ${attrs_str.concat(rels_str).map(toString).join(',\n')}
    ) {}
  `
}

export function generateOutputDTO(cls: ClassDeclaration, attributes: Attribute[], relations: RelationInfo[], package_name: string) : Generated {
  const attrs_str = processAttributes(attributes)
  const rels_str = processRelations(getOutputRelations(relations))

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
        ${attrs_str.concat(rels_str).map(str => toString(str)+',').join('\n')}
        LocalDateTime createdAt
    ) {}
  `
}

/**
 * Dada uma lista de RelationInfo, retorna a lista de quais dessas relações são passadas no InputDTO.
 */
export function getInputRelations(relations: RelationInfo[]) : RelationInfo[] {
  return relations.filter(r => r.owner)
}

/**
 * Dada uma lista de RelationInfo, retorna a lista de quais dessas relações são passadas no OutputDTO.
 * 
 * No momento, isso se resume a "qualquer relação exceto OneToOne que você não é dono", pois pode ser um null pointer
 */
export function getOutputRelations(relations: RelationInfo[]) : RelationInfo[] {
  return relations.filter(r => r.owner || !(r.card === "OneToOne"))
}
