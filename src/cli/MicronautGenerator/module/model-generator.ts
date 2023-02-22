import { CompositeGeneratorNode, expandToStringWithNL, Generated } from "langium";
import { ClassDeclaration } from "../../../language-server/generated/ast";
import { capitalizeString } from "../generator-utils";
import { RelationInfo } from "./relations";

export function generateModel(cls: ClassDeclaration, is_supertype: boolean, relations: RelationInfo[], package_name: string) : Generated {
  const supertype = cls.specializationEndurants.length > 0 ?
    cls.specializationEndurants[0].ref :
    undefined

  return expandToStringWithNL`
    package ${package_name}.models;

    import lombok.Getter;
    import lombok.Setter;
    import lombok.Builder;
    import lombok.NoArgsConstructor;
    import lombok.AllArgsConstructor;
    import lombok.experimental.SuperBuilder;

    import javax.persistence.Id;
    import javax.persistence.Inheritance;
    import javax.persistence.InheritanceType;
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
    @SuperBuilder
    @NoArgsConstructor
    @AllArgsConstructor
    @Table(name = "${cls.name.toLowerCase()}")
    ${is_supertype ? '@Inheritance(strategy = InheritanceType.JOINED)' : undefined}
    public class ${cls.name} ${supertype ? `extends ${supertype.name}` : ''} implements Serializable {
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
