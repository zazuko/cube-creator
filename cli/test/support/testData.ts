import { csvw, hydra, rdf, schema } from '@tpluscode/rdf-ns-builders'
import { cc } from '@cube-creator/core/namespace'
import { DELETE, INSERT } from '@tpluscode/sparql-builder'
import StreamClient from 'sparql-http-client/StreamClient'
import env from '@cube-creator/core/env'

export const client = new StreamClient({
  updateUrl: 'http://db.cube-creator.lndo.site/cube-creator/update',
  endpointUrl: 'http://db.cube-creator.lndo.site/cube-creator/query',
})

const clientOptions = () => ({
  base: env.API_CORE_BASE,
})

function removeTestGraphs() {
  return DELETE`graph ?g { ?s ?p ?o }`
    .WHERE`VALUES ?g {
      </project/cli-test>
      </project/cli-test/mapping>
      </project/cli-test/tables>
      </project/cli-test/mapping/table/foo>
      </project/cli-test/source/foo>
      </cube/cli-test>
    }`
    .WHERE`graph ?g { ?s ?p ?o }`
    .execute(client.query, clientOptions())
}

export const insertTestData = async () => {
  await removeTestGraphs()

  return INSERT.DATA`
  graph </project/cli-test> {
      </project/cli-test>
          a ${hydra.Resource} , ${cc.CubeProject} ;
          ${cc.csvMapping} </project/cli-test/mapping> ;
          ${cc.cube}       </cube/cli-test>
    .
  }

  graph </project/cli-test/mapping> {
      </project/cli-test/mapping>
          a ${hydra.Resource}, ${cc.CsvMapping} ;
          ${cc.tables} </project/cli-test/tables>
      .
  }

  graph </project/cli-test/tables> {
      </project/cli-test/tables>
          a ${hydra.Collection} ;
          ${hydra.manages} [
              ${hydra.property} ${rdf.type} ;
              ${hydra.object}   ${cc.Table} ;
          ] , [
              ${hydra.property} ${cc.csvMapping} ;
              ${hydra.object}   </project/cli-test/mapping>
          ];
      .
  }

  graph </project/cli-test/mapping/table/foo> {
      </project/cli-test/mapping/table/foo>
          a ${hydra.Collection}, ${cc.Table} ;
          ${cc.csvw}       </project/cli-test/mapping/table/foo/csvw> ;
          ${cc.csvMapping} </project/cli-test/mapping> ;
          ${cc.csvSource}  </project/cli-test/source/foo> ;
          ${schema.name}   "Foo table" ;
      .
  }

  graph </project/cli-test/source/foo> {
      </project/cli-test/source/foo>
          a ${hydra.Resource} , ${cc.CSVSource} ;
          ${csvw.dialect} [
              ${csvw.quoteChar} "\\"" ;
              ${csvw.delimiter} "," ;
              ${csvw.header}    true ;
          ] ;
          ${schema.associatedMedia} [
              ${schema.identifier} "test-data/ubd28/input_CH_yearly_air_immission_basetable.csv"
          ]
      .
  }
  `.execute(client.query, clientOptions())
}
