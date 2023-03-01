import { join } from 'path';
import { readFileSync } from 'fs'
import { serializationUtils, Class as OntoClass, Relation as OntoRelation, Generalization } from "ontouml-js";
import { Entity as GenEntity, Cardinality as GenCardinality } from './types';

const text = readFileSync(join('./examples', '/generated', '/micronaut.json')).toString()
const ontouml = serializationUtils.parse(text)
const all_contents = ontouml.getAllContents()

for(const elem of all_contents) {
    // console.log(elem.type)
    if(elem.type === "Relation") {
        console.log(elem)
    }
}

const ontouml_classes = all_contents.filter(x => x.type === 'Class').map(x => x as OntoClass)

// Registering datatypes
const datatypes: Map<string, string> = new Map()
for(const x of ontouml_classes.filter(x => x.stereotype === "datatype")) {
    datatypes.set(x.id, x.name.getText())
}
console.log(datatypes)

// Converts an Ontouml-js Class to a Generator Entity
const OntoClass_to_GenEntity = (cls: OntoClass) : GenEntity => {
    return {
        name: cls.name.getText(),
        attributes: Array.from(cls.properties, p => {
            return {name: p.name.getText(), type: datatypes.get(p.propertyType.id) ?? 'undefined'}
        }),
        relations: [],
        is_supertype: false,
        parent_attributes: [],
        parent_relations: []
    }
}
// Registering Kinds and Subkinds
const entities: Map<string, GenEntity> = new Map()
for(const x of ontouml_classes) {
    if(x.stereotype === "kind" || x.stereotype == "subkind") {
        entities.set(x.id, OntoClass_to_GenEntity(x))
    }
}

// Registering Relations
function revert_card(card: GenCardinality) : GenCardinality {
  switch(card) {
  case 'OneToOne':
    return 'OneToOne'
  case 'OneToMany':
    return 'ManyToOne'
  case 'ManyToOne':
    return 'OneToMany'
  case 'ManyToMany':
    return 'ManyToMany'
  }
}
function card_to_string(card1: string, card2: string) : GenCardinality {
    const lft = card1 === '1' ?
        'One' : 'Many'
    const rgt = card2 === '1' ?
        'One' : 'Many'
    return `${lft}To${rgt}`
}
const add_relation = (owner: GenEntity, non_owner: GenEntity, card_name: GenCardinality) => {
    owner.relations.push({
        target: non_owner,
        cardinality: card_name,
        owner: true
    })
    non_owner.relations.push({
        target: owner,
        cardinality: revert_card(card_name),
        owner: false
    })
}

const ontouml_relations = all_contents.filter(x => x.type === 'Relation').map(x => x as OntoRelation)
for(const x of ontouml_relations) {
    const lft = x.properties.at(0)
    const rgt = x.properties.at(1)
    if(lft && rgt) {
        const lft_cls  = entities.get(lft.propertyType.id)
        const lft_card = lft.cardinality.value.at(-1)
        const rgt_cls  = entities.get(rgt.propertyType.id)
        const rgt_card = rgt.cardinality.value.at(-1)
        if(lft_cls && lft_card && rgt_cls && rgt_card) {
            const card_name = card_to_string(lft_card, rgt_card)
            if(card_name === "OneToMany") {
                add_relation(rgt_cls, lft_cls, "ManyToOne")
            } else {
                add_relation(lft_cls, rgt_cls, card_name)
            }
        }
    }
}

// Registering Supertypes
const ontouml_generalizations = all_contents.filter(x => x.type === 'Generalization').map(x => x as Generalization)
for(const x of ontouml_generalizations) {
    const general = entities.get(x.general.id)
    const specific = entities.get(x.specific.id)
    if(general && specific) {
        general.is_supertype = true
        specific.extends = general
    }
}
console.dir(entities.values(), {depth: 3})
// console.log(entities.values())
