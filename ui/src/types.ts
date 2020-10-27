import { Collection, Resource, RuntimeOperation } from 'alcaeus'

export interface CommonActions {
  create: RuntimeOperation | null,
  edit: RuntimeOperation | null,
  delete: RuntimeOperation | null,
}

export interface ProjectsCollection extends Collection {
  actions: CommonActions;
}

export interface SourcesCollection extends Collection {
  actions: CommonActions & {
    upload: RuntimeOperation | null,
  };
}

export interface TableCollection extends Collection {
  actions: CommonActions;
}

export interface CSVMapping extends Resource {
  actions: CommonActions;
  sourcesCollection: SourcesCollection;
  tableCollection: TableCollection;
}

export interface Project extends Resource {
  actions: CommonActions;
  csvMapping: null | CSVMapping;
}

export interface CSVColumn extends Resource {
  actions: CommonActions;
  name: string;
  order: number;
  sampleValues: string[];
}

export interface Source extends Resource {
  actions: CommonActions;
  name: string;
  columns: CSVColumn[];
}

export interface Table extends Resource {
  actions: CommonActions;
  name: string;
  source: Source;
}
