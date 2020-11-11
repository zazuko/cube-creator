import { Collection, RdfResource, Resource, RuntimeOperation } from 'alcaeus'
import { Term } from 'rdf-js'
import { Job as JobModel } from '@cube-creator/model/Job'

export interface CommonActions {
  create: RuntimeOperation | null,
  edit: RuntimeOperation | null,
  delete: RuntimeOperation | null,
}

export interface APIResource extends Resource, RdfResource {
  clientPath: string;
}

export interface CSVColumn extends APIResource {
  actions: CommonActions;
  name: string;
  order: number;
  sampleValues: string[];
}

export interface Source extends APIResource {
  actions: CommonActions;
  name: string;
  columns: CSVColumn[];
}

export interface SourcesCollection extends Collection<Source> {
  actions: CommonActions & {
    upload: RuntimeOperation | null,
  };
}

export interface ColumnMapping extends APIResource {
  sourceColumn: CSVColumn;
  targetProperty: Term;
  datatype: Term | null;
  language: string | null;
}

export interface Table extends APIResource {
  actions: CommonActions & {
    createColumnMapping: RuntimeOperation | null,
  };
  name: string;
  source: Source;
  color: string;
  columnMappings: ColumnMapping[];
}

export interface TableCollection extends Collection<Table> {
  actions: CommonActions;
}

export interface CSVMapping extends APIResource {
  actions: CommonActions;
  sourcesCollection: SourcesCollection;
  tableCollection: TableCollection;
}

export interface Project extends APIResource {
  actions: CommonActions;
  csvMapping: null | CSVMapping;
  jobCollectionId: string | null;
}

export interface ProjectsCollection extends Collection<Project> {
  actions: CommonActions;
}

export type Job = APIResource & JobModel & {
  actions: CommonActions;
  name: string;
}

export interface JobCollection extends Collection<Job> {
  actions: CommonActions;
}
