import path from "path";
import fs from "fs";

import { ClassDeclaration, isClassDeclaration, Model } from "../../language-server/generated/ast";
import { expandToStringWithNL, Generated, toString } from "langium";

import { createPath } from "./generator-utils";

import { processRelations } from "./module/relations";
import { generateModel } from "./module/model-generator";
import { generateController } from "./module/controller-generator";
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
    const mod_classes = mod.declarations.filter(isClassDeclaration)
    for(const cls of mod_classes) {
      const class_name = cls.name
      const relations = relation_maps.get(cls) ?? []

      fs.writeFileSync(path.join(MODELS_PATH,       `${class_name}.java`), toString(generateModel(cls, relations, package_name)))
      fs.writeFileSync(path.join(APPLICATIONS_PATH, `${class_name}Apl.java`), toString(generateApplication(cls, package_name)))
      fs.writeFileSync(path.join(DTOS_PATH,         `${class_name}InputDto.java`), toString(generateInputDTO(cls, relations, package_name)))
      fs.writeFileSync(path.join(DTOS_PATH,         `${class_name}OutputDto.java`), toString(generateOutputDTO(cls, relations, package_name)))
      fs.writeFileSync(path.join(CONTROLLERS_PATH,  `${class_name}Controller.java`), toString(generateController(cls, relations, package_name)))
      fs.writeFileSync(path.join(REPOSITORIES_PATH, `${class_name}Repository.java`), toString(generateClassRepository(cls, package_name)))
      fs.writeFileSync(path.join(EXCEPTIONS_PATH,   `${class_name}NotFoundException.java`), toString(generateClassNotFoundException(cls, package_name)))
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
