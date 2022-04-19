import { Initializer } from '@tpluscode/rdfine/RdfResource'
import { NodeShape, fromPointer as nodeShape } from '@rdfine/shacl/lib/NodeShape'
import { PropertyShape } from '@rdfine/shacl'
import { fromPointer as iriTemplate } from '@rdfine/hydra/lib/IriTemplate'
import { dash, dcterms, foaf, hydra, rdf, schema, sd, sh, xsd } from '@tpluscode/rdf-ns-builders/strict'
import { editor, md, meta } from '@cube-creator/core/namespace'
import { AnyPointer } from 'clownface'
import env from '@cube-creator/core/env'
import { lindasQuery } from '@cube-creator/core/lindas'
import { CONSTRUCT } from '@tpluscode/sparql-builder'

const sharedDimensionQuery = CONSTRUCT`
  ?c a ${hydra.Collection} .
  ?c ${hydra.member} ?dim .
  ?dim ?p ?o .
`.WHERE`
  BIND ( iri('${env.API_CORE_BASE}dimensions') as ?c )

  ?dim a ${md.SharedDimension} ; ?p ?o
`._getTemplateResult()

const hierarchyRootsQuery = lindasQuery(CONSTRUCT`
  ?c a ${hydra.Collection} .
  ?c ${hydra.member} ?term .
  ?term ?p ?o .
`.WHERE`
  BIND ( iri('${env.API_CORE_BASE}dimensionTerms') as ?c )

  ?term ${schema.inDefinedTermSet} <{dimension}> .
  ?term ${schema.name} ?name ; ?p ?o .

  filter(regex(?name, "{q}"))
`
  ._getTemplateResult()).value
  .replace('%7Bq%7D', '{q}')
  .replace('%7Bdimension%7D', '{dimension}')

export default function ({ rdfTypeProperty = false }: { rdfTypeProperty?: boolean } = {}) {
  return (graph: AnyPointer): Initializer<NodeShape> => {
    const publicQueryEndpoint = graph.blankNode()
      .addOut(sd.endpoint, graph.namedNode(env.PUBLIC_QUERY_ENDPOINT))
      .addOut(foaf.page, env.TRIFID_UI)

    const nextInHierarchyShapeId = graph.blankNode()
    const nextInHierarchyShape = nodeShape(nextInHierarchyShapeId, {
      property: [{
        name: 'Name',
        path: schema.name,
        minCount: 1,
        maxCount: 1,
        datatype: xsd.string,
        order: 10,
      }, {
        name: 'Type',
        description: 'Select a specific type of resource. The selection will also determine the properties available for selection',
        path: sh.targetClass,
        maxCount: 1,
        nodeKind: sh.IRI,
        order: 15,
        [dash.editor.value]: editor.HierarchyLevelTargetEditor,
        [dcterms.source.value]: publicQueryEndpoint,
      }, {
        name: 'Property',
        description: 'Define how this level in hierarchy connects to the parent. Select ***inverse*** to choose from properties directed from the lower level up. Otherwise, properties directed down will be show',
        path: sh.path,
        minCount: 1,
        maxCount: 1,
        node: nodeShape({
          xone: [{
            nodeKind: sh.IRI,
          }, {
            nodeKind: sh.BlankNode,
            property: {
              path: sh.inversePath,
              nodeKind: sh.IRI,
              minCount: 1,
              maxCount: 1,
            },
          }],
        }),
        order: 20,
        [dash.editor.value]: editor.HierarchyPathEditor,
        [dcterms.source.value]: publicQueryEndpoint,
      }, {
        name: 'Next level',
        path: meta.nextInHierarchy,
        order: 25,
        [dash.editor.value]: dash.DetailsEditor,
        nodeKind: sh.BlankNode,
        node: nextInHierarchyShapeId,
        maxCount: 1,
      }],
    })

    const property: Initializer<PropertyShape> = [{
      name: 'Name',
      path: schema.name,
      minCount: 1,
      maxCount: 1,
      datatype: xsd.string,
      order: 1,
    }, {
      name: 'Root dimension',
      path: md.sharedDimension,
      minCount: 1,
      maxCount: 1,
      nodeKind: sh.IRI,
      [dash.editor.value]: dash.InstancesSelectEditor,
      [hydra.collection.value]: lindasQuery(sharedDimensionQuery),
      order: 5,
    }, {
      name: 'Root',
      path: meta.hierarchyRoot,
      minCount: 1,
      nodeKind: sh.IRI,
      [dash.editor.value]: dash.AutoCompleteEditor,
      order: 10,
      [hydra.search.value]: iriTemplate({
        variableRepresentation: hydra.ExplicitRepresentation,
        template: hierarchyRootsQuery,
        mapping: [{
          variable: 'dimension',
          property: md.sharedDimension,
          required: true,
        }, {
          variable: 'q',
          property: hydra.freetextQuery,
          [sh.minLength.value]: 0,
        }],
      }),
    }, {
      name: 'Next level',
      path: meta.nextInHierarchy,
      order: 15,
      [dash.editor.value]: dash.DetailsEditor,
      nodeKind: sh.BlankNode,
      node: nextInHierarchyShape,
      minCount: 1,
      maxCount: 1,
    }]

    if (rdfTypeProperty) {
      property.push({
        path: rdf.type,
        hasValue: [hydra.Resource, meta.Hierarchy, md.Hierarchy],
        [dash.hidden.value]: true,
      })
    }

    return {
      name: 'Hierarchy',
      targetClass: meta.Hierarchy,
      property,
    }
  }
}
