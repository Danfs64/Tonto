import { expandToStringWithNL, Generated } from "langium";
import { ClassDeclaration } from "../../../language-server/generated/ast";
import { capitalizeString } from "../generator-utils";
import { getInputRelations } from "./dtos-generator";
import { RelationInfo } from "./relations";

export function generateController(cls: ClassDeclaration, relations: RelationInfo[], package_name: string) : Generated {
  const inputRelations = getInputRelations(relations)

  return expandToStringWithNL`
    package ${package_name}.controllers;

    import ${package_name}.models.${cls.name};
    import ${package_name}.dtos.${cls.name}InputDto;
    import ${package_name}.dtos.${cls.name}OutputDto;
    import ${package_name}.applications.${cls.name}Apl;
    ${inputRelations.map(r => `import ${package_name}.applications.${r.tgt.name}Apl;`).join('\n')}
    import ${package_name}.exceptions.${cls.name}NotFoundException;
    ${inputRelations.map(r => `import ${package_name}.exceptions.${r.tgt.name}NotFoundException;`).join('\n')}

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
        ${inputRelations.map(r => `private final ${r.tgt.name}Apl ${r.tgt.name.toLowerCase()}_app;`).join('\n')}
        private final ${cls.name}Apl ${cls.name.toLowerCase()}_app;

        @Post(uri = "/", consumes = MediaType.APPLICATION_JSON)
        @Transactional
        public HttpResponse<Void> create(@Body @Valid ${cls.name}InputDto dto) {
            ${inputRelations.map(r => {
              const name = r.tgt.name.toLowerCase()
              if(r.card === "ManyToMany") {
                return `var ${name}s = dto.${name}_ids().stream().map(id -> ${name}_app.findById(id).orElseThrow(() -> new ${r.tgt.name}NotFoundException(id))).toList();`
              } else {
                return `var ${name} = ${name}_app.findById(dto.${name}_id()).orElseThrow(() -> new ${r.tgt.name}NotFoundException(dto.${name}_id()));`
              }
            }).join('\n')}
            var data = ${cls.name}.builder()
                ${inputRelations.map(r => {
                  if(r.card === "ManyToMany") {
                    return `.${r.tgt.name.toLowerCase()}s(${r.tgt.name.toLowerCase()}s)`
                  } else {
                    return `.${r.tgt.name.toLowerCase()}(${r.tgt.name.toLowerCase()})`
                  }
                }).join('\n')}
                ${cls.attributes.map(a => `.${a.name.toLowerCase()}(dto.${a.name.toLowerCase()}())`).join('\n')}
                .build();
            var saved = this.${cls.name.toLowerCase()}_app.save(data);
            return HttpResponse.created(URI.create("/${cls.name.toLowerCase()}s/" + saved.getId()));
        }

        @Get(uri = "/", produces = MediaType.APPLICATION_JSON)
        @Transactional
        public HttpResponse<List<${cls.name}OutputDto>> getAll() {
            var body = ${cls.name.toLowerCase()}_app.findAll()
                .stream()
                .map(elem -> elem.toOutputDTO())
                .toList();
            return HttpResponse.ok(body);
        }

        @Get(uri = "/{id}", produces = MediaType.APPLICATION_JSON)
        @Transactional
        public HttpResponse<${cls.name}OutputDto> getById(@PathVariable UUID id) {
            return ${cls.name.toLowerCase()}_app.findById(id)
                .map(elem -> HttpResponse.ok(elem.toOutputDTO()))
                .orElseThrow(() -> new ${cls.name}NotFoundException(id));
        }

        @Put(uri = "/{id}", consumes = MediaType.APPLICATION_JSON)
        public HttpResponse<?> updateById(@PathVariable UUID id, @Body @Valid ${cls.name}InputDto dto) {
            ${inputRelations.map(r => {
              const name = r.tgt.name.toLowerCase()
              return `var ${name} = ${name}_app.findById(dto.${name}_id()).orElseThrow(() -> new ${r.tgt.name}NotFoundException(dto.${name}_id()));`
            }).join('\n')}
            return ${cls.name.toLowerCase()}_app.findById(id)
                .map(elem -> {
                    ${inputRelations.map(r => `elem.set${capitalizeString(r.tgt.name.toLowerCase())}(${r.tgt.name.toLowerCase()});`).join('\n')}
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
