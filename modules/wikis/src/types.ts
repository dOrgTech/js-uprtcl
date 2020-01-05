import { CacheService } from '@uprtcl/multiplatform';

import { WikisProvider } from './services/wikis.provider';

export interface Wiki {
  title: string;
  pages: Array<string>;
}

export type WikisLocal = CacheService & WikisProvider;

export const WikiTypes = {
  WikiEntity: Symbol('wiki-entity'),
  WikisLocal: Symbol('wikis-local'),
  WikisRemote: Symbol('wikis-remote'),
  Wikis: Symbol('wikis')
};
