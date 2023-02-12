import { CompositeGeneratorNode, expandToString, expandToStringWithNL, Generated } from "langium";
import { ClassDeclaration } from "../../../language-server/generated/ast";
import { capitalizeString } from "../generator-utils";
import { RelationInfo } from "./relations";

export function generateModel(cls: ClassDeclaration, relations: RelationInfo[], package_name: string) : Generated {
  return expandToStringWithNL`
    package ${package_name}.models;

    import ${package_name}.dtos.${cls.name}OutputDto;

    import lombok.Getter;
    import lombok.Setter;
    import lombok.Builder;
    import lombok.NoArgsConstructor;
    import lombok.AllArgsConstructor;

    import javax.persistence.Id;
    import javax.persistence.Table;
    import javax.persistence.Entity;
    import javax.persistence.OneToOne;
    import javax.persistence.OneToMany;
    import javax.persistence.ManyToOne;
    import javax.persistence.ManyToMany;
    // import javax.persistence.OrderColumn;
    import javax.persistence.CascadeType;
    import javax.persistence.GeneratedValue;

    import org.hibernate.annotations.GenericGenerator;

    import java.io.Serializable;
    import java.time.LocalDateTime;
    // import java.util.ArrayList;
    import java.util.List;
    import java.util.Objects;
    import java.util.UUID;

    @Getter
    @Setter
    @Entity
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Table(name = "posts")
    public class ${cls.name} implements Serializable {
        @Id
        @GeneratedValue(generator = "uuid")
        @GenericGenerator(name = "uuid", strategy = "uuid2")
        UUID id;

        ${cls.attributes.map(a => `${capitalizeString(a.attributeType ?? 'NOTYPE')} ${a.name.toLowerCase()};`).join('\n')}

        ${generateRelations(cls, relations)}

        @Builder.Default
        LocalDateTime createdAt = LocalDateTime.now();

        @Override
        public boolean equals(Object o) {
              if (this == o) return true;
              if (o == null || this.getClass() != o.getClass()) return false;

            ${cls.name} elem = (${cls.name}) o;
            return getId().equals(elem.getId());
        }

        @Override
        public int hashCode() {
            return Objects.hash(getId());
        }

        @Override
        public String toString() {
            return "${cls.name} {" +
                "id="+id+
                ${cls.attributes.map(a => `", ${a.name}='"+${a.name.toLowerCase()}+"'"+`).join('\n')}
            '}';
        }

        ${generateToOutputDTO(cls, relations)}
    }
  `
}

function generateRelations(cls: ClassDeclaration, relations: RelationInfo[]) : Generated {
  const node = new CompositeGeneratorNode()

  for(const rel of relations) {
    node.append(generateRelation(cls, rel))
  }

  return node
}

function generateRelation(cls: ClassDeclaration, {tgt, card, owner}: RelationInfo) : Generated {
  switch(card) {
  case "OneToOne":
    return ''
  case "OneToMany":
    if(owner) {
      return ''
    } else {
      return expandToStringWithNL`
        @OneToMany(cascade = {CascadeType.ALL}, orphanRemoval = true, mappedBy = "${cls.name.toLowerCase()}")
        @Builder.Default
        Set<${tgt.name}> ${tgt.name.toLowerCase()}s = new HashSet<>();
      `
    }
  case "ManyToOne":
    if(owner) {
      return expandToStringWithNL`
        @ManyToOne
        @JoinColumn(name = "${tgt.name.toLowerCase()}_id")
        private ${tgt.name} ${tgt.name.toLowerCase()};
      `
    } else {
      return ''
    }
  case "ManyToMany":
    return ''
  }
}

function generateToOutputDTO(cls: ClassDeclaration, relations: RelationInfo[]) : Generated {
  const relationToOutputField = (rel: RelationInfo) => {
    switch(rel.card) {
      case "ManyToOne":
        return `this.get${capitalizeString(rel.tgt.name.toLowerCase())}().getID(),`
      case "OneToMany":
        return `this.get${capitalizeString(rel.tgt.name.toLowerCase())}s().stream().map(elem -> elem.getId()).toList(),`
      default:
        return `NOT IMPLEMENTED`
    }
  }

  return expandToString`
    public ${cls.name}OutputDto toOutputDTO() {
        return new ${cls.name}OutputDto(
            this.getId(),
            ${cls.attributes.map(a => `this.get${capitalizeString(a.name)}(),`).join('\n')}
            ${relations.map(relationToOutputField).join('\n')}
            this.createdAt()
        );
    }
  `
}
