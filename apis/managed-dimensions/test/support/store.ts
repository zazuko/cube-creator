import sinon from 'sinon'
import { ManagedDimensionsStore } from '../../lib/store'

export function testStore(): sinon.SinonStubbedInstance<ManagedDimensionsStore> {
  return {
    load: sinon.stub(),
    save: sinon.stub(),
    delete: sinon.stub(),
  }
}
