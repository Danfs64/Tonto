import path from "path";
import fs from "fs";

import { ClassDeclaration, isClassDeclaration, Model } from "../../language-server/generated/ast";
import { expandToStringWithNL, Generated, toString } from "langium";

import { capitalizeString, createPath } from "./generator-utils";

import { generateClassNotFoundException, generateNotFoundException, generateNotFoundHandler } from "./module/exception-generator";
import { generateInputDTO, generateOutputDTO } from "./module/dtos-generator";

export function generateModules(model: Model, target_folder: string) : void {
    for(const mod of model.modules) {
        const MODULE_PATH = createPath(target_folder, "src/main/java/base/", mod.name)
        const mod_classes = mod.declarations.filter(isClassDeclaration)
        const package_name = `base.${mod.name}`

        const APPLICATIONS_PATH = createPath(MODULE_PATH, 'applications')
        const REPOSITORIES_PATH = createPath(MODULE_PATH, 'repositories')
        const CONTROLLERS_PATH  = createPath(MODULE_PATH, 'controllers')
        const EXCEPTIONS_PATH   = createPath(MODULE_PATH, 'exceptions')
        const MODELS_PATH       = createPath(MODULE_PATH, 'models')
        const DTOS_PATH         = createPath(MODULE_PATH, 'dtos')

        fs.writeFileSync(path.join(EXCEPTIONS_PATH, 'NotFoundException.java'), toString(generateNotFoundException(package_name)))
        fs.writeFileSync(path.join(EXCEPTIONS_PATH, 'NotFoundHandler.java'),   toString(generateNotFoundHandler(package_name)))
        for(const cls of mod_classes) {
            const class_name = cls.name

            fs.writeFileSync(path.join(MODELS_PATH,       `${class_name}.java`), toString(generateModel(cls, package_name)))
            fs.writeFileSync(path.join(APPLICATIONS_PATH, `${class_name}Apl.java`), toString(generateApplication(cls, package_name)))
            fs.writeFileSync(path.join(DTOS_PATH,         `${class_name}InputDto.java`), toString(generateInputDTO(cls, package_name)))
            fs.writeFileSync(path.join(DTOS_PATH,         `${class_name}OutputDto.java`), toString(generateOutputDTO(cls, package_name)))
            fs.writeFileSync(path.join(CONTROLLERS_PATH,  `${class_name}Controller.java`), toString(generateController(cls, package_name)))
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

function generateController(cls: ClassDeclaration, package_name: string) : Generated {
    return expandToStringWithNL`
        package ${package_name}.controllers;

        import ${package_name}.models.${cls.name};
        import ${package_name}.dtos.${cls.name}InputDto;
        import ${package_name}.dtos.${cls.name}OutputDto;
        import ${package_name}.applications.${cls.name}Apl;
        import ${package_name}.exceptions.${cls.name}NotFoundException;

        import java.net.URI;
        import java.util.List;
        import java.util.UUID;
        import jakarta.inject.Inject;
        import javax.validation.Valid;
        import javax.transaction.Transactional;
        import lombok.RequiredArgsConstructor;
        import io.micronaut.http.HttpResponse;
        import io.micronaut.http.MediaType;
        import io.micronaut.http.annotation.Body;
        import io.micronaut.http.annotation.Controller;
        import io.micronaut.http.annotation.Delete;
        import io.micronaut.http.annotation.Get;
        import io.micronaut.http.annotation.Post;
        import io.micronaut.http.annotation.Put;
        import io.micronaut.http.annotation.PathVariable;
        import io.micronaut.validation.Validated;

        @Controller("/${cls.name.toLowerCase()}s")
        @RequiredArgsConstructor(onConstructor_ = {@Inject})
        @Validated
        public class ${cls.name}Controller {
            private final ${cls.name}Apl ${cls.name.toLowerCase()}_app;

            @Post(uri = "/", consumes = MediaType.APPLICATION_JSON)
            @Transactional
            public HttpResponse<Void> create(@Body @Valid ${cls.name}InputDto dto) {
                var data = ${cls.name}.builder()
                    ${cls.attributes.map(a => `.${a.name.toLowerCase()}(dto.${a.name.toLowerCase()}())`).join('\n')}
                    .build();
                var saved = this.${cls.name.toLowerCase()}_app.save(data);
                return HttpResponse.created(URI.create("/${cls.name.toLowerCase()}s/" + saved.getId()));
            }

            @Get(uri = "/", produces = MediaType.APPLICATION_JSON)
            public HttpResponse<List<${cls.name}OutputDto>> getAll() {
                var body = ${cls.name.toLowerCase()}_app.findAll()
                    .stream()
                    .map(elem -> new ${cls.name}OutputDto(elem.getId()${cls.attributes.map(a => `, elem.get${capitalizeString(a.name)}()`).join('')}))
                    .toList();
                return HttpResponse.ok(body);
            }

            @Get(uri = "/{id}", produces = MediaType.APPLICATION_JSON)
            public HttpResponse<${cls.name}OutputDto> getById(@PathVariable UUID id) {

                return ${cls.name.toLowerCase()}_app.findById(id)
                    .map(elem -> HttpResponse.ok(new ${cls.name}OutputDto(elem.getId()${cls.attributes.map(a => `, elem.get${capitalizeString(a.name)}()`).join('')})))
                    .orElseThrow(() -> new ${cls.name}NotFoundException(id));
            }

            @Put(uri = "/{id}", consumes = MediaType.APPLICATION_JSON)
            public HttpResponse<?> updateById(@PathVariable UUID id, @Body @Valid ${cls.name}InputDto dto) {
                return ${cls.name.toLowerCase()}_app.findById(id)
                    .map(elem -> {
                        ${cls.attributes.map(a => `elem.set${capitalizeString(a.name)}(dto.${a.name.toLowerCase()}());`).join('\n')}
                        this.${cls.name.toLowerCase()}_app.update(elem);
                        return HttpResponse.ok(dto);
                    })
                    .orElseThrow(() -> new ${cls.name}NotFoundException(id));
            }

            @Delete(uri = "/{id}", produces = MediaType.APPLICATION_JSON)
            @Transactional
            public HttpResponse<?> deleteById(@PathVariable UUID id) {
                return ${cls.name.toLowerCase()}_app.findById(id)
                    .map(elem -> {
                        this.${cls.name.toLowerCase()}_app.delete(elem);
                        return HttpResponse.noContent();
                    })
                    .orElseThrow(() -> new ${cls.name}NotFoundException(id));
            }
        }
    `
}

function generateModel(cls: ClassDeclaration, package_name: string) : Generated {
    return expandToStringWithNL`
        package ${package_name}.models;

        import lombok.Getter;
        import lombok.Setter;
        import lombok.Builder;
        import lombok.NoArgsConstructor;
        import lombok.AllArgsConstructor;

        import javax.persistence.Id;
        import javax.persistence.Table;
        import javax.persistence.Entity;
        // import javax.persistence.OneToMany;
        import javax.persistence.OrderColumn;
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

            // @Builder.Default
            // Status status = Status.DRAFT;

            // @Builder.Default
            // LocalDateTime createdAt = LocalDateTime.now();

            // @OneToMany(cascade = {CascadeType.ALL}, orphanRemoval = true, mappedBy = "post")
            // @Builder.Default
            // @OrderColumn(name = "comment_idx")
            // List<Comment> comments = new ArrayList<>();

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
