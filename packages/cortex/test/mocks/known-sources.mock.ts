import { KnownSourcesService } from '../../src/services/known-sources/known-sources.service';
import { Dictionary } from 'lodash';
import uniq from 'lodash/uniq';

export class KnownSourcesMock implements KnownSourcesService {
  constructor(protected sourceName: string, public knownSources: Dictionary<string[]> = {}) {}

  getOwnSource(): Promise<string> {
    return new Promise(resolve => setTimeout(() => resolve(this.sourceName), 500));
  }

  getKnownSources(hash: string): Promise<string[]> {
    return Promise.resolve(this.knownSources[hash]);
  }

  async addKnownSources(hash: string, sources: string[]): Promise<void> {
    if (!sources || sources.length === 0) {
      return;
    }

    const previousSources = await this.getKnownSources(hash);
    if (previousSources) {
      this.knownSources[hash] = uniq([...sources, ...previousSources]);
    } else {
      this.knownSources[hash] = sources;
    }
  }

  async removeKnownSource(hash: string, source: string): Promise<void> {
    let knownSources = await this.getKnownSources(hash);
    knownSources = knownSources.filter(s => s !== source);
    if (knownSources.length === 0) {
      delete this.knownSources[hash];
    } else {
      this.knownSources[hash] = knownSources;
    }
  }
}
