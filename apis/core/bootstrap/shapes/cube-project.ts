import { cc, sh1, shape, editor } from '@cube-creator/core/namespace'
import { dash, dcterms, hydra, rdf, rdfs, schema, sh } from '@tpluscode/rdf-ns-builders'
import { turtle } from '@tpluscode/rdf-string'
import $rdf from 'rdf-ext'

const cubeIdPattern = $rdf.literal('^[a-zA-Z0-9/\\-._,]+[^/]$')

const generatedProperties = [
  dcterms.creator,
  cc.cubeGraph,
  cc.dataset,
  cc.jobCollection,
  cc.latestPublishedRevision,
  cc.csvMapping,
  cc.export,
  cc.projectDetails,
]

const projectProperties = turtle`
  ${sh.property} [
    ${sh.name} "Project name" ;
    ${sh.path} ${rdfs.label} ;
    ${sh.minCount} 1 ;
    ${sh.maxCount} 1 ;
    ${sh.minLength} 1 ;
    ${sh.order} 10 ;
  ] ;
  ${sh.property} [
    ${sh.name} "Publishing profile" ;
    ${sh.description} "Defines core cube publishing settings (location, endpoints, etc)" ;
    ${sh.path} ${schema.maintainer} ;
    ${sh.class} ${schema.Organization} ;
    ${sh.minCount} 1 ;
    ${sh.maxCount} 1 ;
    ${sh.nodeKind} ${sh.IRI} ;
    ${dash.editor} ${dash.InstancesSelectEditor} ;
    ${hydra.collection} <organizations> ;
    ${sh.order} 20 ;
  ] ;
  ${sh.xone} (
    [
      ${sh.closed} true ;
      ${sh.ignoredProperties} (
        ${rdfs.label}
        ${schema.maintainer}
        ${rdf.type}
        ${generatedProperties}
      ) ;
      ${sh.property} [
        ${sh.path} ${cc.projectSourceKind} ;
        ${sh.hasValue} ${cc['projectSourceKind/CSV']} ;
        ${dash.hidden} true ;
      ] ;
      ${sh.property} [
        ${sh.name} "Cube identifier" ;
        ${sh.description} "A unique, URL-safe string to identify the cube (only letters, digits, -, . and _)" ;
        ${sh.path} ${dcterms.identifier} ;
        ${sh.minLength} 1 ;
        ${sh.minCount} 1 ;
        ${sh.maxCount} 1 ;
        ${sh.pattern} ${cubeIdPattern} ;
        ${sh.order} 40 ;
      ] ;
    ]
    [
      ${sh.closed} true ;
      ${sh.ignoredProperties} (
        ${rdfs.label}
        ${schema.maintainer}
        ${rdf.type}
        ${generatedProperties}
      ) ;
      ${sh.property} [
        ${sh.path} ${cc.projectSourceKind} ;
        ${sh.hasValue} ${cc['projectSourceKind/ExistingCube']} ;
        ${dash.hidden} true ;
      ] ;
      ${sh.property} [
        ${sh.name} "Cube" ;
        ${sh.description} "Cube identifier (URI) to import" ;
        ${sh.path} ${cc('CubeProject/sourceCube')} ;
        ${sh.nodeKind} ${sh.IRI} ;
        ${dash.editor} ${dash.URIEditor} ;
        ${sh.minCount} 1 ;
        ${sh.maxCount} 1 ;
        ${sh.order} 40 ;
      ] ;
      ${sh.property} [
        ${sh.name} "SPARQL Endpoint" ;
        ${sh.description} "A public endpoint from which to load the cube" ;
        ${sh.path} ${cc('CubeProject/sourceEndpoint')} ;
        ${sh.nodeKind} ${sh.IRI} ;
        ${dash.editor} ${dash.URIEditor} ;
        ${sh.minCount} 1 ;
        ${sh.maxCount} 1 ;
        ${sh.order} 50 ;
      ] ;
      ${sh.property} [
        ${sh.name} "Graph name" ;
        ${sh.description} "Graph containing the cube. If missing, the default graph will be queried" ;
        ${sh.path} ${cc('CubeProject/sourceGraph')} ;
        ${sh.nodeKind} ${sh.IRI} ;
        ${dash.editor} ${dash.URIEditor} ;
        ${sh.maxCount} 1 ;
        ${sh.order} 60 ;
      ] ;
    ]
    [
      ${sh.closed} true ;
      ${sh.ignoredProperties} (
        ${rdfs.label}
        ${schema.maintainer}
        ${rdf.type}
        ${generatedProperties}
      ) ;
      ${sh.property} [
        ${sh.path} ${cc.projectSourceKind} ;
        ${sh.hasValue} ${cc['projectSourceKind/ExportedProject']} ;
        ${dash.hidden} true ;
      ] ;
      ${sh.property} [
        ${sh.name} "Project data" ;
        ${sh.path} ${cc.export} ;
        ${dash.editor} ${editor.FileUpload} ;
        ${sh.minCount} 1 ;
        ${sh.maxCount} 1 ;
        ${sh.order} 40 ;
      ];
      ${sh.property} [
        ${sh.name} "Cube identifier" ;
        ${sh.description} "Needed only when it is different from exported project's identifier" ;
        ${sh.path} ${dcterms.identifier} ;
        ${sh.pattern} ${cubeIdPattern} ;
        ${sh.minLength} 1 ;
        ${sh.maxCount} 1 ;
        ${sh.order} 50 ;
      ];
    ]
  ) ;`

export const CubeProjectShape = turtle`
${shape('cube-project/create')} {
  ${shape('cube-project/create')} a ${sh.NodeShape}, ${hydra.Resource} ;
    ${sh.targetClass} ${cc.CubeProject} ;
    ${rdfs.label} "Cube Project" ;
    ${sh1.xoneDiscriminator} ${cc.projectSourceKind} ;
    ${sh.property} [
      ${sh.name} "Start project from" ;
      ${sh.path} ${cc.projectSourceKind} ;
      ${sh.minCount} 1 ;
      ${sh.maxCount} 1 ;
      ${sh.nodeKind} ${sh.IRI} ;
      ${sh.in} (
        ${cc['projectSourceKind/CSV']}
        ${cc['projectSourceKind/ExistingCube']}
        ${cc['projectSourceKind/ExportedProject']}
      ) ;
      ${sh.defaultValue} ${cc['projectSourceKind/CSV']} ;
      ${sh.order} 30 ;
    ] ;
    ${projectProperties}
  .

  ${cc['projectSourceKind/CSV']}
    ${rdfs.label} "CSV File(s)" ;
    ${rdfs.comment} "Map CSV files to a new Cube" ;
  .

  ${cc['projectSourceKind/ExistingCube']}
    ${rdfs.label} "Existing Cube" ;
    ${rdfs.comment} "Add metadata to a Cube resulting of another pipeline" ;
  .

  ${cc['projectSourceKind/ExportedProject']}
    ${rdfs.label} "Exported project" ;
    ${rdfs.comment} "Import project backup" ;
  .
}

${shape('cube-project/update')} {
  ${shape('cube-project/update')} a ${sh.NodeShape}, ${hydra.Resource} ;
    ${sh.targetClass} ${cc.CubeProject} ;
    ${rdfs.label} "Cube Project" ;
    ${sh1.xoneDiscriminator} ${cc.projectSourceKind} ;
    ${projectProperties} ;
  .
}

${shape('cube-project/search')} {
  ${shape('cube-project/search')} a ${sh.NodeShape}, ${hydra.Resource} ;
    ${sh.property} [
      ${sh.name} "Keyword Search" ;
      ${sh.order} 10 ;
      ${sh.path} ${hydra.freetextQuery} ;
      ${sh.minCount} 1 ;
      ${sh.maxCount} 1 ;
    ],
    [
      ${sh.name} "Author" ;
      ${sh.path} ${dcterms.creator} ;
      ${sh.order} 20 ;
      ${sh.minCount} 1 ;
      ${sh.maxCount} 1 ;
      ${dash.editor} ${dash.InstancesSelectEditor} ;
      ${hydra.collection} </users> ;
    ],
    [
      ${sh.name} "Status" ;
      ${sh.path} ${schema.creativeWorkStatus} ;
      ${sh.order} 30 ;
      ${sh.minCount} 1 ;
      ${sh.maxCount} 1 ;
      ${dash.editor} ${dash.InstancesSelectEditor} ;
      ${hydra.collection} </cube-projects/status> ;
    ] ;
  .
}
`
