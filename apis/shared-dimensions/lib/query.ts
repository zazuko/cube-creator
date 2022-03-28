import { Term } from 'rdf-js'
import namespace from '@rdfjs/namespace'
import $rdf from 'rdf-ext'
import { sparql } from '@tpluscode/sparql-builder'
import env from './env'

export function textSearch(subject: Term, predicate: Term, textQuery: string) {
  switch (env.maybe.MANAGED_DIMENSIONS_STORE_ENGINE) {
    case 'stardog': {
      const fts = namespace('tag:stardog:api:search:')
      const variable = $rdf.variable('_s')
      return sparql`
        service ${fts.textMatch} {
          [] ${fts.query} '${textQuery + '*'}';
             ${fts.result} ${variable} ;
        }
        ${subject} ${predicate} ${variable} .
      `
    }
    case 'fuseki': {
      const variable = $rdf.variable('_s')
      return sparql`
        ${subject} <http://jena.apache.org/text#query> (${predicate} '${textQuery + '*'}') .

        # Second filtering to make sure the word starts with the given query
        ${subject} ${predicate} ${variable} .
        FILTER (REGEX(${variable}, "^${textQuery}", "i"))
      `
    }
    default: {
      const variable = $rdf.variable('_s')
      return sparql`
        ${subject} ${predicate} ${variable} .
        FILTER (REGEX(${variable}, "^${textQuery}", "i"))
      `
    }
  }
}
