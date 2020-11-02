import { Collection, Resource, RuntimeOperation } from 'alcaeus'
import { Term } from 'rdf-js'

export interface CommonActions {
  create: RuntimeOperation | null,
  edit: RuntimeOperation | null,
  delete: RuntimeOperation | null,
}

export interface APIResource extends Resource {
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
  actions: CommonActions;
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
}

export interface ProjectsCollection extends Collection<Project> {
  actions: CommonActions;
}
