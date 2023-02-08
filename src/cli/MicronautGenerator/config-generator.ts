import path from 'path'
import fs from 'fs'

import { Model } from "../../language-server/generated/ast";
import { expandToStringWithNL, Generated, toString } from 'langium';
import { createPath } from './generator-utils';

export function generateConfigs(model: Model, target_folder: string) {
  fs.writeFileSync(path.join(target_folder, 'GUIDE.md'), toString(generateGuide()))
  fs.writeFileSync(path.join(target_folder, 'docker-compose.yml'), toString(generateCompose()))

  const RESOURCE_PATH = createPath(target_folder, "src/main/resources")
  fs.writeFileSync(path.join(RESOURCE_PATH, 'application.yml'), toString(generateApplication(model)))
}

// TODO no comando micronaut, conferir se o nome `base.demo` tá certo ou não
function generateGuide() : Generated {
  return expandToStringWithNL`
    # README

    * Instale o Micronaut (3.8.1+) na sua máquina
    * Rode o seguinte comando, para gerar o projeto Micronaut:
      \`mn create-app --build=gradle --jdk=17 --lang=java --test=junit --features=postgres,openapi,data-jpa,lombok,assertj,testcontainers base.demo\`
    * Passe os todos os arquivos gerados pelo gerador para dentro da pasta gerada pelo Micronaut
    * Adicione a seguinte linha ao arquivo \`gradle.properties\`:
      * \`org.gradle.jvmargs=-Dmicronaut.openapi.views.spec=redoc.enabled=true,rapidoc.enabled=true,swagger-ui.enabled=true,swagger-ui.theme=flattop\`
  `
}

function generateCompose() : Generated {
  return expandToStringWithNL`
    version: '3.7'

    services:
      postgres:
        image: postgres
        ports:
          - "5432:5432"
        restart: always
        environment:
          POSTGRES_PASSWORD: password
          POSTGRES_DB: blogdb
          POSTGRES_USER: user
        volumes:
          - ./data:/var/lib/postgresql
          - ./pg-initdb.d:/docker-entrypoint-initdb.d
  `
}

function generateApplication(model: Model) : Generated {
  return expandToStringWithNL`
    micronaut:
      application:
        name: ${path.basename(model.$document?.uri.path ?? '')}
      router:
        static-resources:
          swagger:
            paths: classpath:META-INF/swagger
            mapping: /swagger/**
          swagger-ui:
            paths: classpath:META-INF/swagger/views/swagger-ui
            mapping: /swagger-ui/**
          rapidoc:
            paths: classpath:META-INF/swagger/views/rapidoc
            mapping: /rapidoc/**
          redoc:
            paths: classpath:META-INF/swagger/views/redoc-ui
            mapping: /redoc/**

    datasources:
      default:
        url: jdbc:postgresql://localhost:5432/blogdb
        username: user
        password: password
        driver-class-name: org.postgresql.Driver
        schema-generate: CREATE_DROP
        db-type: postgres
        dialect: POSTGRES
    jpa.default.properties.hibernate.hbm2ddl.auto: update
    jpa:
    default:
      properties:
        hibernate:
          hbm2ddl:
            auto: update
    netty:
      default:
        allocator:
          max-order: 3
  `
}
