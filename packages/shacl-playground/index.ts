import { DatasetCore } from 'rdf-js'
import { turtle } from '@tpluscode/rdf-string'
import fetch from 'node-fetch'

export function createPlaygroundUrl(shapesGraph: DatasetCore, dataGraph: DatasetCore) {
  const url = new URL('https://shacl-playground.zazuko.com/')
  const hash = new URLSearchParams([
    ['shapesGraph', turtle`${shapesGraph}`.toString()],
    ['dataGraph', turtle`${dataGraph}`.toString()],
    ['shapesGraphFormat', 'text/turtle'],
    ['dataGraphFormat', 'text/turtle'],
  ])

  url.hash = hash.toString()
  return shorten(url.toString())
}

async function shorten(url: string) {
  const res = await fetch('https://s.zazuko.com/api/v1/shorten/', {
    method: 'POST',
    body: new URLSearchParams({ url }),
  })

  if (!res.ok) {
    throw new Error(await res.text())
  }

  return res.text()
}
