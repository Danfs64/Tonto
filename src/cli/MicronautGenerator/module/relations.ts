import { ClassDeclaration, ContextModule, isClassDeclaration, isElementRelation } from "../../../language-server/generated/ast"

export type RelationInfo = {
  tgt: ClassDeclaration,
  card: RelationType,
  owner: boolean
}
type RelationType = 'OneToMany' | 'OneToOne' | 'ManyToOne' | 'ManyToMany'

function revert_card(card: RelationType) : RelationType {
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

function card_to_string(card1: number | '*', card2: number | '*') : RelationType {
  const lft = card1 === 1 ?
    'One' : 'Many'
  const rgt = card2 === 1 ?
    'One' : 'Many'
  return `${lft}To${rgt}`
}

/**
 * Dado um módulo, lê todas as relações internas dele,
 * retornando um mapa que mapeia um Class para a lista
 * de {alvo, cardinalidade e ownership} de suas relações
 */
export function processRelations(
  mod: ContextModule
) : Map<ClassDeclaration, RelationInfo[]> {
  // Inicializa o mapa com listas vazias
  const map: Map<ClassDeclaration, RelationInfo[]> = new Map()
  for(const cls of mod.declarations.filter(isClassDeclaration)) {
    map.set(cls, new Array())
  }

  for(const rel of mod.declarations.filter(isElementRelation)) {
    const lft_cls = rel.firstEnd?.ref
    const lft_card =
      rel.firstCardinality?.upperBound ??
      rel.firstCardinality?.lowerBound ??
      1

    const rgt_cls = rel.secondEnd.ref
    const rgt_card =
      rel.secondCardinality?.upperBound ??
      rel.secondCardinality?.lowerBound ??
      1

    if(lft_cls === undefined || rgt_cls === undefined) {
      continue
    }

    const card_name = card_to_string(lft_card, rgt_card)
    map.get(lft_cls)?.push({
      tgt: rgt_cls,
      card: card_name,
      owner: true
    })
    map.get(rgt_cls)?.push({
      tgt: lft_cls,
      card: revert_card(card_name),
      owner: false
    })
  }
  return map
}

/**
 * Dada uma lista de RelationInfo, retorna a lista de quais dessas relações são passadas no InputDTO
 * @param relations 
 */
export function getInputRelations(relations: RelationInfo[]) : RelationInfo[] {
  return relations.filter(r => r.owner && r.card === 'ManyToOne')
}

export function getOutputRelations(relations: RelationInfo[]) : RelationInfo[] {
  return relations
}
