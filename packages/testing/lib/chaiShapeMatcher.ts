import type { BlankNode, DatasetCore, NamedNode } from '@rdfjs/types'
import chai from 'chai'
import type { NodeShape, ValidationResult } from '@rdfine/shacl'
import { Initializer, RdfResource, ResourceIdentifier } from '@tpluscode/rdfine/RdfResource'
import $rdf from '@cube-creator/env'
import type { GraphPointer, MultiPointer } from 'clownface'
import Validator from 'rdf-validate-shacl'
import type * as Validate from 'rdf-validate-shacl/src/validation-report'
import { rdf, sh } from '@tpluscode/rdf-ns-builders'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Chai {
    interface Assertion {
      matchShape(shapeInit: Initializer<NodeShape> | DatasetCore | GraphPointer<ResourceIdentifier>): void
    }
  }
}

function isRdfine(shapeLike: any): shapeLike is RdfResource {
  return 'equals' in shapeLike && typeof shapeLike.equals === 'function'
}

function isGraphPointer(shapeLike: any): shapeLike is MultiPointer<NamedNode | BlankNode> {
  return '_context' in shapeLike && (shapeLike.term?.termType === 'BlankNode' || shapeLike.term?.termType === 'NamedNode')
}

function isDataset(shapeLike: any): shapeLike is DatasetCore {
  return 'match' in shapeLike && typeof shapeLike.match === 'function'
}

function toJSON(result: Validate.ValidationResult) {
  const { focusNode, resultMessage, resultPath, resultSeverity } = $rdf.rdfine().factory.createEntity<ValidationResult>(result.pointer).toJSON()

  return {
    focusNode,
    resultMessage,
    resultPath,
    resultSeverity,
  }
}

function hasTarget(shape: NodeShape): boolean {
  return shape.targetNode.length > 0 || shape.targetClass.length > 0
}

chai.Assertion.addMethod('matchShape', function (shapeInit: Initializer<NodeShape> | DatasetCore | GraphPointer<ResourceIdentifier>) {
  const obj = this._obj
  let targetNode: ResourceIdentifier[] = []
  let resourceDataset: DatasetCore
  let actual: any
  if (isDataset(obj)) {
    resourceDataset = obj
    targetNode = !isDataset(shapeInit) && !isGraphPointer(shapeInit) && shapeInit.targetNode as any
    actual = $rdf.dataset([...resourceDataset]).toString()
  } else if (isRdfine(obj)) {
    resourceDataset = obj.pointer.dataset
    targetNode.push(obj.id)
    actual = obj.toJSON()
  } else if (isGraphPointer(obj)) {
    resourceDataset = obj.dataset
    targetNode = [...obj.terms]
    const Resource = $rdf.rdfine.Resource
    actual = targetNode.map(term => new Resource($rdf.clownface({ dataset: resourceDataset, term })).toJSON())
  } else {
    throw new Error(`Cannot match given object to a SHACL Shape. Expecting a rdfine object, graph pointer or RDF/JS dataset. Got ${obj?.constructor.name}`)
  }

  let shape: NodeShape
  if (isDataset(shapeInit)) {
    const [shapePointer] = $rdf.clownface({ dataset: shapeInit })
      .has(rdf.type, [sh.Shape, sh.NodeShape]).toArray()
    shape = $rdf.rdfine.sh.NodeShape(shapePointer, { targetNode })
  } else if (isGraphPointer(shapeInit)) {
    shape = $rdf.rdfine.sh.NodeShape(shapeInit, { targetNode })
  } else {
    shape = $rdf.rdfine.sh.NodeShape(
      $rdf.clownface().blankNode(),
      { ...shapeInit, targetNode })
  }

  if (!hasTarget(shape)) {
    throw new Error('No targets defined to validate in data graph')
  }

  const validator = new Validator(shape.pointer.dataset)
  const report = validator.validate(resourceDataset)

  this.assert(
    report.conforms,
    'SHACL Validation errors were found:\n' + JSON.stringify(report.results.map(toJSON), null, 2),
    'Expected graph not to conform to the given shape graph',
    shape.toJSON(),
    actual,
    true,
  )
})
