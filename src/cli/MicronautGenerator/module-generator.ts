import path from "path";
import fs from "fs";

import { Attribute, ClassDeclaration, ContextModule, isClassDeclaration, Model } from "../../language-server/generated/ast";
import { expandToStringWithNL, Generated, toString } from "langium";

import { createPath } from "./generator-utils";

import { generateModel } from "./module/model-generator";
import { generateController } from "./module/controller-generator";
import { processRelations, RelationInfo } from "./module/relations";
import { generateInputDTO, generateOutputDTO } from "./module/dtos-generator";
import { generateClassNotFoundException, generateNotFoundException, generateNotFoundHandler } from "./module/exception-generator";

export function generateModules(model: Model, target_folder: string) : void {
  for(const mod of model.modules) {
    const package_name      = `base.${mod.name}`
    const MODULE_PATH       = createPath(target_folder, "src/main/java/base/", mod.name)
    const APPLICATIONS_PATH = createPath(MODULE_PATH, 'applications')
    const REPOSITORIES_PATH = createPath(MODULE_PATH, 'repositories')
    const CONTROLLERS_PATH  = createPath(MODULE_PATH, 'controllers')
    const EXCEPTIONS_PATH   = createPath(MODULE_PATH, 'exceptions')
    const MODELS_PATH       = createPath(MODULE_PATH, 'models')
    const DTOS_PATH         = createPath(MODULE_PATH, 'dtos')

    fs.writeFileSync(path.join(EXCEPTIONS_PATH, 'NotFoundException.java'), toString(generateNotFoundException(package_name)))
    fs.writeFileSync(path.join(EXCEPTIONS_PATH, 'NotFoundHandler.java'),   toString(generateNotFoundHandler(package_name)))

    const relation_maps = processRelations(mod)
    const supertype_classes = processSupertypes(mod)
    const mod_classes = mod.declarations.filter(isClassDeclaration)
    for(const cls of mod_classes) {
      const class_name = cls.name
      const {attributes, relations} = getAttrsAndRelations(cls, relation_maps)

      fs.writeFileSync(path.join(MODELS_PATH,       `${class_name}.java`), toString(generateModel(cls, supertype_classes.has(cls), relations, package_name)))
      fs.writeFileSync(path.join(APPLICATIONS_PATH, `${class_name}Apl.java`), toString(generateApplication(cls, package_name)))
      fs.writeFileSync(path.join(DTOS_PATH,         `${class_name}InputDto.java`), toString(generateInputDTO(cls, attributes, relations, package_name)))
      fs.writeFileSync(path.join(DTOS_PATH,         `${class_name}OutputDto.java`), toString(generateOutputDTO(cls, attributes, relations, package_name)))
      fs.writeFileSync(path.join(CONTROLLERS_PATH,  `${class_name}Controller.java`), toString(generateController(cls, attributes, relations, package_name)))
      fs.writeFileSync(path.join(REPOSITORIES_PATH, `${class_name}Repository.java`), toString(generateClassRepository(cls, package_name)))
      fs.writeFileSync(path.join(EXCEPTIONS_PATH,   `${class_name}NotFoundException.java`), toString(generateClassNotFoundException(cls, package_name)))
    }
  }
}

/**
 * Dado um módulo, retorna todos as classes dele que são usadas como Superclasses
 */
function processSupertypes(mod: ContextModule) : Set<ClassDeclaration | undefined> {
  const set: Set<ClassDeclaration | undefined> = new Set()
  for(const cls of mod.declarations.filter(isClassDeclaration)) {
    if(cls.specializationEndurants.length > 0) {
      set.add(cls.specializationEndurants[0].ref)
    }
  }
  return set
}

/**
 * Retorna todos os atributos e relações de uma Class, incluindo a de seus supertipos
 */
function getAttrsAndRelations(cls: ClassDeclaration, relation_map: Map<ClassDeclaration, RelationInfo[]>) : {attributes: Attribute[], relations: RelationInfo[]} {
  // Se tem superclasse, puxa os atributos e relações da superclasse
  if(cls.specializationEndurants.length > 0 && cls.specializationEndurants[0].ref) {
    const parent = cls.specializationEndurants[0].ref
    const {attributes, relations} = getAttrsAndRelations(parent, relation_map)

    return {
      attributes: attributes.concat(cls.attributes),
      relations: relations.concat(relation_map.get(cls) ?? [])
    }
  } else {
    return {
      attributes: cls.attributes,
      relations: relation_map.get(cls) ?? []
    }
  }
}

function generateClassRepository(cls: ClassDeclaration, package_name: string) : Generated {
  return expandToStringWithNL`
    package ${package_name}.repositories;

    import ${package_name}.models.${cls.name};

    import java.util.UUID;
    import io.micronaut.data.annotation.Repository;
    import io.micronaut.data.jpa.repository.JpaRepository;

    @Repository
    public interface ${cls.name}Repository extends JpaRepository<${cls.name}, UUID>{

    }
  `
}

function generateApplication(cls: ClassDeclaration, package_name: string) : Generated {
  return expandToStringWithNL`
    package ${package_name}.applications;

    import ${package_name}.models.${cls.name};
    import ${package_name}.repositories.${cls.name}Repository;

    import java.util.List;
    import java.util.Optional;
    import java.util.UUID;
    import jakarta.inject.Singleton;
    import lombok.RequiredArgsConstructor;

    @Singleton
    @RequiredArgsConstructor
    public class ${cls.name}Apl {
        private final ${cls.name}Repository repo;

        public ${cls.name} save(${cls.name} p) {
            return this.repo.save(p);
        }

        public List<${cls.name}> findAll() {
            return this.repo.findAll();
        }

        public Optional<${cls.name}> findById(UUID id) {
            return this.repo.findById(id);
        }

        public ${cls.name} update(${cls.name} p) {
            return this.repo.update(p);
        }

        public void delete(${cls.name} p) {
            this.repo.delete(p);
        }
    }
  `
}
