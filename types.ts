export type Cardinality = 'OneToMany' | 'OneToOne' | 'ManyToOne' | 'ManyToMany'

export type Attribute = {
    name: string
    type: string
}

export type Relation  = {
    target: Entity
    owner: boolean
    cardinality: Cardinality
}

export type Entity = {
    name: string
    attributes: Attribute[]
    relations: Relation[]
    is_supertype: boolean
    extends?: Entity
    parent_attributes: Attribute[]
    parent_relations: Relation[]
}
