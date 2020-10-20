import { Collection, Resource, RuntimeOperation } from 'alcaeus'

export interface ProjectsCollection extends Collection {
  actions: {
    create: RuntimeOperation | null,
  };
}

export interface SourcesCollection extends Collection {
  actions: {
    upload: RuntimeOperation | null,
  };
}

export interface CSVMapping extends Resource {
  actions: Record<string, unknown>;
  sourcesCollection: SourcesCollection,
}

export interface Project extends Resource {
  actions: Record<string, unknown>;
  csvMapping: null | CSVMapping;
}

export interface CSVColumn extends Resource {
  actions: Record<string, unknown>;
  name: string;
  order: number;
  sampleValues: string[];
}

export interface Source extends Resource {
  actions: {
    delete: RuntimeOperation | null,
  };
  name: string;
  columns: CSVColumn[];
}
