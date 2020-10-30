import chai from 'chai'
import { NodeShape, NodeShapeMixin, ValidationResult } from '@rdfine/shacl'
import { ShapeBundle, ValidationResultBundle } from '@rdfine/shacl/bundles'
import RdfResourceImpl, { Initializer, RdfResource } from '@tpluscode/rdfine/RdfResource'
import { DatasetCore, Term } from 'rdf-js'
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

function isGraphPointer(shapeLike: any): shapeLike is MultiPointer {
  return '_context' in shapeLike
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
  let targetNode: Term[] = []
  let resourceDataset: DatasetCore
  if (isRdfine(obj)) {
    resourceDataset = obj.pointer.dataset
    targetNode.push(obj.id)
  } else if (isDataset(obj)) {
    resourceDataset = obj
  } else if (isGraphPointer(obj)) {
    resourceDataset = obj.dataset
    targetNode = [...obj.terms]
  } else {
    throw new Error('Cannot match given object to a SHACL Shape')
  }

  const shape = new NodeShapeMixin.Class(
    clownface({ dataset: $rdf.dataset() }).blankNode(),
    { ...shapeInit, targetNode })

  const validator = new Validator(shape.pointer.dataset)
  const report = validator.validate(resourceDataset)

  this.assert(
    report.conforms,
    'Expected graph to conform to the given shape graph',
    'Expected graph not to conform to the given shape graph',
    [],
    report.results.map(toJSON),
    true,
  )
})
