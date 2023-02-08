import { ClassDeclaration, ContextModule, isClassDeclaration, isElementRelation } from "../../../language-server/generated/ast"

type RelationType = 'OnetoMany' | 'OnetoOne' | 'ManytoOne' | 'ManytoMany'

function revert_card(card: RelationType) : RelationType {
  switch(card) {
  case 'OnetoOne':
    return 'OnetoOne'
  case 'OnetoMany':
    return 'ManytoOne'
  case 'ManytoOne':
    return 'OnetoMany'
  case 'ManytoMany':
    return 'ManytoMany'
  }
}

function card_to_string(card1: number | '*', card2: number | '*') : RelationType {
  const lft = card1 === 1 ?
    'One' : 'Many'
  const rgt = card2 === 1 ?
    'One' : 'Many'
  return `${lft}to${rgt}`
}

/**
 * Dado um módulo, lê todas as relações internas dele,
 * retornando um mapa que mapeia um Class para a lista
 * de {alvo, cardinalidade e ownership} de suas relações
 */
export function processRelations(
  mod: ContextModule
) : Map<ClassDeclaration, {
  tgt: ClassDeclaration,
  card: RelationType,
  owner: boolean
}[]> {
  // Inicializa o mapa com listas vazias
  const map: Map<ClassDeclaration, {
    tgt: ClassDeclaration,
    card: RelationType,
    owner: boolean
  }[]> = new Map()
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

