import Dexie from 'dexie';
import { inject, injectable } from 'inversify';

import { CacheService, DiscoveryModule } from '@uprtcl/multiplatform';
import { Hashed, Signed, IsSecure } from '@uprtcl/cortex';
import { Secured, CorePatterns } from '@uprtcl/common';

import { Perspective, Commit, EveesLocal, PerspectiveDetails } from '../../types';

@injectable()
export class EveesDexie extends Dexie implements EveesLocal {
  details: Dexie.Table<Partial<PerspectiveDetails>, string>;

  constructor(
    @inject(CorePatterns.Secured)
    protected securedPattern: IsSecure<any>,
    @inject(DiscoveryModule.types.Cache)
    protected objectsCache: CacheService
  ) {
    super('uprtcl');
    this.version(0.1).stores({
      details: ',context'
    });
    this.details = this.table('details');
  }

  /**
   * Service is already ready on instantiaton
   */
  public ready() {
    return Promise.resolve();
  }

  /**
   * @override
   */
  public get<T extends object>(hash: string): Promise<Hashed<T> | undefined> {
    return this.objectsCache.get(hash);
  }

  /**
   * @override
   */
  public cache<T extends object>(hash: string, object: T): Promise<void> {
    return this.objectsCache.cache(hash, object);
  }

  /**
   * @override
   */
  async clonePerspective(perspective: Secured<Perspective>): Promise<void> {
    if (!this.securedPattern.validate(perspective)) {
      throw new Error('Perspective is not valid');
    }

    await this.cache(perspective.id, perspective);
  }

  /**
   * @override
   */
  async cloneCommit(commit: Secured<Commit>): Promise<void> {
    if (!this.securedPattern.validate(commit)) {
      throw new Error('Commit is not valid');
    }

    await this.cache(commit.id, commit);
  }

  /**
   * @override
   */
  async updatePerspectiveDetails(
    perspectiveId: string,
    details: Partial<PerspectiveDetails>
  ): Promise<void> {
    const oldDetails = await this.details.get(perspectiveId);
    const newDetails = { ...oldDetails, ...details };

    await this.details.put(newDetails, perspectiveId);
  }

  /**
   * @override
   */
  getPerspectiveDetails(perspectiveId: string): Promise<PerspectiveDetails> {
    return this.details.get(perspectiveId);
  }

  /**
   * @override
   */
  async getContextPerspectives(context: string): Promise<Secured<Perspective>[]> {
    const perspectivesIds = await this.details
      .where('context')
      .equals(context)
      .primaryKeys();

    if (!perspectivesIds) return [];

    const promises = perspectivesIds.map(perspective => this.get<Signed<Perspective>>(perspective));
    const perspectives = await Promise.all(promises);
    return perspectives.filter(p => p !== undefined) as Secured<Perspective>[];
  }
}
