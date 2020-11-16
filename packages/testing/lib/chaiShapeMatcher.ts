import chai from 'chai'
import type { NodeShape, ValidationResult } from '@rdfine/shacl'
import { NodeShapeMixin } from '@rdfine/shacl/NodeShape'
import { ShapeBundle, ValidationResultBundle } from '@rdfine/shacl/bundles'
import RdfResourceImpl, { Initializer, RdfResource, ResourceIdentifier } from '@tpluscode/rdfine/RdfResource'
import { BlankNode, DatasetCore, NamedNode, Term } from 'rdf-js'
import $rdf from 'rdf-ext'
import clownface, { MultiPointer } from 'clownface'
import Validator, * as Validate from 'rdf-validate-shacl'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Chai {
    interface Assertion {
      matchShape(shapeInit: Initializer<NodeShape>): void
    }
  }
}

RdfResourceImpl.factory.addMixin(...ShapeBundle, ...ValidationResultBundle)

function isRdfine(shapeLike: any): shapeLike is RdfResource {
  return 'equals' in shapeLike && typeof shapeLike.equals === 'function'
}

function isGraphPointer(shapeLike: any): shapeLike is MultiPointer<NamedNode | BlankNode> {
  return '_context' in shapeLike && shapeLike.terms.every(({ termType }: Term) => termType === 'BlankNode' || termType === 'NamedNode')
}

function isDataset(shapeLike: any): shapeLike is DatasetCore {
  return 'match' in shapeLike && typeof shapeLike.match === 'function'
}

function toJSON(result: Validate.ValidationResult) {
  const { focusNode, resultMessage, resultPath, resultSeverity } = RdfResourceImpl.factory.createEntity<ValidationResult>(result.cf).toJSON()

  return {
    focusNode,
    resultMessage,
    resultPath,
    resultSeverity,
  }
}

chai.Assertion.addMethod('matchShape', function (shapeInit: Initializer<NodeShape>) {
  const obj = this._obj
  let targetNode: ResourceIdentifier[] = []
  let resourceDataset: DatasetCore
  let actual: any
  if (isRdfine(obj)) {
    resourceDataset = obj.pointer.dataset
    targetNode.push(obj.id)
    actual = obj.toJSON()
  } else if (isDataset(obj)) {
    resourceDataset = obj
    actual = $rdf.dataset([...resourceDataset]).toString()
  } else if (isGraphPointer(obj)) {
    resourceDataset = obj.dataset
    targetNode = [...obj.terms]
    actual = targetNode.map(term => new RdfResourceImpl(clownface({ dataset: resourceDataset, term })).toJSON())
  } else {
    throw new Error(`Cannot match given object to a SHACL Shape. Expecting a rdfine object, graph pointer or RDF/JS dataset. Got ${obj?.constructor.name}`)
  }

  const shape = new NodeShapeMixin.Class(
    clownface({ dataset: $rdf.dataset() }).blankNode(),
    { ...shapeInit, targetNode })

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
