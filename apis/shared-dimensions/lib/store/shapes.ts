import { resolve } from 'path'
import type { AnyPointer } from 'clownface'
import { fromFile } from '@zazuko/rdf-utils-fs'
import $rdf from '@zazuko/env'

export async function loadShapes(): Promise<AnyPointer> {
  const path = resolve(__dirname, 'shapes.ttl')
  return $rdf.clownface({
    dataset: await $rdf.dataset().import(fromFile($rdf, path)),
  })
}
