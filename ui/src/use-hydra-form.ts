import type { Shape } from '@rdfine/shacl'
import * as $rdf from '@rdf-esm/dataset'
import type { RdfResource, ResourceIdentifier, RuntimeOperation } from 'alcaeus'
import clownface, { GraphPointer } from 'clownface'
import { computed, ref, Ref, shallowRef, ShallowRef, watch } from 'vue'
import { Term } from 'rdf-js'
import { sh1 } from '@cube-creator/core/namespace'
import { sh } from '@tpluscode/rdf-ns-builders/strict'
import { api } from './api'
import { APIErrorValidation, ErrorDetails } from './api/errors'

const initResource = () => clownface({ dataset: $rdf.dataset() }).namedNode('')

interface HydraFormOptions {
  beforeSubmit?: () => Promise<boolean> | boolean
  afterSubmit?: (savedResource: RdfResource | null | undefined) => any
  fetchShapeParams?: { targetClass?: Term }
  saveHeaders?: HeadersInit
}

export function useHydraForm (operation: Ref<RuntimeOperation | null | undefined>, options: HydraFormOptions = {}) {
  const resource: Ref<GraphPointer | null> = ref(initResource())
  const shape: ShallowRef<Shape | null> = shallowRef(null)
  const error: ShallowRef<ErrorDetails | null> = shallowRef(null)
  const isSubmitting = ref(false)

  const loadShape = async () => {
    if (operation.value) {
      shape.value = await api.fetchOperationShape(operation.value, options.fetchShapeParams)
      const minCounts = shape.value?.pointer.any()
        .has(sh1.minCount)
      minCounts?.forEach(minCount => {
        minCount.addOut(sh.minCount, minCount.out(sh1.minCount))
      })
    } else {
      shape.value = null
    }
  }
  watch(operation, loadShape, { immediate: true })

  const title = computed(() => operation.value?.title ?? '...')

  const onSubmit = async (data: GraphPointer<ResourceIdentifier>) => {
    if (options.beforeSubmit) {
      const shouldContinue = await options.beforeSubmit()
      if (!shouldContinue) {
        return
      }
    }

    error.value = null
    isSubmitting.value = true

    try {
      const savedResource = await api.invokeSaveOperation<RdfResource>(operation.value, data, options.saveHeaders)

      if (options.afterSubmit) {
        await options.afterSubmit(savedResource)
      }
    } catch (e: any) {
      error.value = e.details ?? { detail: e.toString() }

      if (!(e instanceof APIErrorValidation)) {
        console.error(e)
      }
    } finally {
      isSubmitting.value = false
    }
  }

  return {
    operation,
    resource,
    shape,
    error,
    isSubmitting,
    title,
    onSubmit,
  }
}
