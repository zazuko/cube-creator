import { Collection, RuntimeOperation } from 'alcaeus'

export interface ProjectsCollection extends Collection {
  actions: {
    create: RuntimeOperation | null,
  };
}
