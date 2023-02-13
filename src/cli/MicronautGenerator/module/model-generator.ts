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
    import javax.persistence.JoinColumn;
    import javax.persistence.JoinTable;
    import javax.persistence.CascadeType;
    import javax.persistence.GeneratedValue;

    import org.hibernate.annotations.GenericGenerator;

    import java.io.Serializable;
    import java.time.LocalDateTime;
    import java.util.Set;
    import java.util.HashSet;
    import java.util.Objects;
    import java.util.UUID;

    @Getter
    @Setter
    @Entity
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Table(name = "${cls.name.toLowerCase()}")
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
    if(owner) {
      return expandToStringWithNL`
        @OneToOne
        @JoinColumn(name = "${tgt.name.toLowerCase()}_id", referencedColumnName = "id")
        private ${tgt.name} ${tgt.name.toLowerCase()};
      `
    } else {
      return expandToStringWithNL`
        @OneToOne(cascade = {CascadeType.ALL}, orphanRemoval = true, mappedBy = "${cls.name.toLowerCase()}")
        @Builder.Default
        private ${tgt.name} ${tgt.name.toLowerCase()} = null;
      `
    }
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
    if(owner) {
      return expandToStringWithNL`
        @ManyToMany
        @JoinTable(
            name = "${cls.name.toLowerCase()}_${tgt.name.toLowerCase()}",
            joinColumns = @JoinColumn(name = "${cls.name.toLowerCase()}_id"),
            inverseJoinColumns = @JoinColumn(name = "${tgt.name.toLowerCase()}_id")
        )
        @Builder.Default
        private Set<${tgt.name}> ${tgt.name.toLowerCase()}s = new HashSet<>();
      `
    } else {
      return expandToStringWithNL`
        @ManyToMany(mappedBy = "${cls.name.toLowerCase()}s")
        @Builder.Default
        private Set<${tgt.name}> ${tgt.name.toLowerCase()}s = new HashSet<>();
      `
    }
  }
}

function generateToOutputDTO(cls: ClassDeclaration, relations: RelationInfo[]) : Generated {
  const relationToOutputField = ({tgt, card, owner}: RelationInfo) => {
    switch(card) {
      case "OneToOne":
        return owner ? `this.get${capitalizeString(tgt.name.toLowerCase())}().getId(),` : ''
      case "ManyToOne":
        return `this.get${capitalizeString(tgt.name.toLowerCase())}().getId(),`
      case "OneToMany":
      case "ManyToMany":
        return `this.get${capitalizeString(tgt.name.toLowerCase())}s().stream().map(elem -> elem.getId()).toList(),`
    }
  }

  return expandToString`
    public ${cls.name}OutputDto toOutputDTO() {
        return new ${cls.name}OutputDto(
            this.getId(),
            ${cls.attributes.map(a => `this.get${capitalizeString(a.name)}(),`).join('\n')}
            ${relations.map(relationToOutputField).filter(s => s !== '').join('\n')}
            this.getCreatedAt()
        );
    }
  `
}
