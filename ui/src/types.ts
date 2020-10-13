import { Collection, Resource, RuntimeOperation } from 'alcaeus'

export interface ProjectsCollection extends Collection {
  actions: {
    create: RuntimeOperation | null,
  };
}

export interface CSVMapping extends Resource {
  actions: Record<string, unknown>;
}

export interface Project extends Resource {
  actions: Record<string, unknown>;
  csvMapping: null | CSVMapping;
}
