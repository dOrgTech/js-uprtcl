import { multiInject, injectable, inject } from 'inversify';
import { isEqual } from 'lodash-es';

import { PatternRecognizer, Hashed, IsSecure, HasChildren, CortexModule } from '@uprtcl/cortex';
import {
  KnownSourcesService,
  CachedMultiSourceService,
  MultiSourceService,
  DiscoveryService,
  DiscoveryModule
} from '@uprtcl/multiplatform';
import { Logger } from '@uprtcl/micro-orchestrator';
import { Secured, createEntity, CorePatterns } from '@uprtcl/common';

import { EveesLocal, Perspective, Commit, PerspectiveDetails, EveesTypes } from '../types';
import { EveesProvider } from './evees.provider';
import { EveesRemote } from './evees.remote';

export interface NoHeadPerspectiveArgs {
  name?: string;
  context?: string;
}

export type NewPerspectiveArgs = (
  | Partial<PerspectiveDetails>
  | (NoHeadPerspectiveArgs & { dataId: string })
) & { disableRecursive?: boolean };

const creatorId = 'did:hi:ho';
const DEFAULT_PERSPECTIVE_NAME = 'master';

/**
 * Main service used to interact with _Prtcl compatible objects and providers
 */
@injectable()
export class Evees {
  logger = new Logger('evees');

  service: CachedMultiSourceService<EveesLocal, EveesRemote>;

  constructor(
    @inject(CortexModule.types.Recognizer) protected patternRecognizer: PatternRecognizer,
    @inject(CorePatterns.Secured) protected secured: IsSecure<any>,
    @inject(DiscoveryModule.types.LocalKnownSources)
    public knownSources: KnownSourcesService,
    @inject(DiscoveryModule.types.DiscoveryService)
    protected discoveryService: DiscoveryService,
    @inject(EveesTypes.EveesLocal)
    protected eveesLocal: EveesLocal,
    @multiInject(EveesTypes.EveesRemote)
    protected eveesRemotes: EveesRemote[]
  ) {
    this.service = new CachedMultiSourceService<EveesLocal, EveesRemote>(
      eveesLocal,
      new MultiSourceService<EveesRemote>(patternRecognizer, knownSources, eveesRemotes)
    );
  }

  /**
   * @override
   */
  public ready(): Promise<void> {
    return this.service.ready();
  }

  /** Private functions */

  private validateUpl(upl: string | undefined): string {
    const provider = this.service.remote.getService(upl);
    return provider.uprtclProviderLocator;
  }

  /** Public functions */

  /**
   * Returns the uprtcl remote that controls the given perspective, from its origin
   * @returns the uprtcl remote
   */
  public getPerspectiveProvider(perspective: Secured<Perspective>): EveesRemote {
    const perspectiveOrigin = perspective.object.payload.origin;

    const provider = this.service.remote
      .getAllServices()
      .find(provider => provider.uprtclProviderLocator === perspectiveOrigin);

    if (!provider)
      throw new Error(
        `Provider ${perspectiveOrigin} for perspective ${perspective.id} is not registered`
      );

    return provider;
  }

  /** Getters */

  /**
   * @override
   */
  public get<T extends object>(hash: string): Promise<Hashed<T> | undefined> {
    return this.service.get(hash);
  }

  /**
   * @override
   */
  public async getContextPerspectives(context: string): Promise<Secured<Perspective>[]> {
    return this.service.remote.getArrayFromAllServices(uprtcl =>
      uprtcl.getContextPerspectives(context)
    );
  }

  /**
   * @override
   */
  public async getPerspectiveDetails(perspectiveId: string): Promise<PerspectiveDetails> {
    const details = await this.eveesLocal.getPerspectiveDetails(perspectiveId);
    if (details) return details;

    const perspective: Secured<Perspective> | undefined = await this.get(perspectiveId);
    if (!perspective) throw new Error(`Perspective with id ${perspectiveId} not found`);

    const provider = this.getPerspectiveProvider(perspective);

    return provider.getPerspectiveDetails(perspectiveId);
  }

  /** Creators */

  /**
   * Creates a new perspective with the given arguments,
   * creating the context, data and commit if necessary
   *
   * @param args the properties of the perspectives
   * @param upl provider to which to create the perspective, needed if there is more than one provider
   */
  public async createPerspective(
    args: NewPerspectiveArgs,
    upl?: string
  ): Promise<Secured<Perspective>> {
    const name = args.name || DEFAULT_PERSPECTIVE_NAME;

    upl = this.validateUpl(upl);

    // Create the perspective
    const perspectiveData: Perspective = {
      creatorId: creatorId,
      origin: upl,
      timestamp: Date.now()
    };
    const perspective: Secured<Perspective> = await this.secured.derive()(perspectiveData);

    this.logger.info('Created new perspective: ', perspective);

    // Clone the perspective in the selected provider
    await this.clonePerspective(perspective, upl);

    // Create the context to point the perspective to, if needed
    const context = args.context || `${Date.now()}${Math.random()}`;

    // Create the commit to point the perspective to, if needed
    let dataId = (args as { dataId: any }).dataId;
    let headId = (args as { headId: string }).headId;

    if (!dataId && !headId)
      throw new Error(
        'Either the headId or the dataId has to be provided to create the perspective'
      );

    if (!args.disableRecursive) {
      // Create recursive perspective to be able to write in the descendant perspectives
      if (!dataId) {
        const commit: Secured<Commit> | undefined = await this.discoveryService.get(headId);
        if (!commit) throw new Error('Head commit for the perspective was not found');

        dataId = commit.object.payload.dataId;
      }

      const dataHashed: Hashed<any> | undefined = await this.discoveryService.get(dataId);
      if (!dataHashed) throw new Error('Data for the head commit of the perspective was not found');

      const hasChildren: HasChildren | undefined = this.patternRecognizer
        .recognize(dataHashed)
        .find(prop => !!(prop as HasChildren).getChildrenLinks);

      if (hasChildren) {
        const descendantLinks = hasChildren.getChildrenLinks(dataHashed);

        // TODO: generalize to break the assumption that all links are to perspectives
        const promises = descendantLinks.map(async link => {
          const details = await this.getPerspectiveDetails(link);
          const newPerspective = await this.createPerspective(
            { context, name, headId: details.headId },
            upl
          );
          return newPerspective.id;
        });

        const newLinks = await Promise.all(promises);
        const newData: Hashed<any> = hasChildren.replaceChildrenLinks(dataHashed)(newLinks);

        if (!isEqual(dataHashed, newData)) {
          const previousDataUpls = await this.knownSources.getKnownSources(dataId);

          const newDataId = await createEntity(this.patternRecognizer)(
            newData.object,
            previousDataUpls ? previousDataUpls[0] : undefined
          );
          dataId = newDataId;
        }
      }
    }

    if (dataId) {
      const head = await this.createCommit(
        {
          dataId: dataId,
          message: `Commit at ${Date.now()}`,
          parentsIds: headId ? [headId] : []
        },
        upl
      );
      headId = head.id;
    }

    // Set the perspective details
    if (headId || context || name) {
      await this.updatePerspectiveDetails(perspective.id, { headId, context, name });
    }

    return perspective;
  }

  /**
   * Create a new commit with the given properties
   *
   * @param args the properties of the commit
   * @param upl the provider to which to create the commit, needed if there is more than one provider
   */
  public async createCommit(
    args: {
      dataId: string;
      message: string;
      parentsIds: string[];
      creatorsIds?: string[];
      timestamp?: number;
    },
    upl?: string
  ): Promise<Secured<Commit>> {
    upl = this.validateUpl(upl);

    const timestamp = args.timestamp || Date.now();
    const creatorsIds = args.creatorsIds || [creatorId];

    const commitData: Commit = {
      creatorsIds: creatorsIds,
      dataId: args.dataId,
      message: args.message,
      timestamp: timestamp,
      parentsIds: args.parentsIds
    };
    const commit: Secured<Commit> = await this.secured.derive()(commitData);

    this.logger.info('Created new commit: ', commit);

    await this.cloneCommit(commit, upl);

    return commit;
  }

  /** Cloners */

  /**
   * Clones the given perspective in the given provider
   *
   * @param perspective the perspective to clone
   * @param upl the provider to which to clone the perspective to, needed if there is more than one provider
   */
  public async clonePerspective(perspective: Secured<Perspective>, upl?: string): Promise<void> {
    upl = this.validateUpl(upl);

    const creator = async (uprtcl: EveesProvider) => {
      await uprtcl.clonePerspective(perspective);
      return perspective;
    };
    const cloner = async (uprtcl: EveesProvider, perspective: Secured<Perspective>) => {
      await uprtcl.clonePerspective(perspective);
      return perspective;
    };

    await this.service.optimisticCreateIn(upl, creator, cloner);
    this.logger.info('Cloned the perspective: ', perspective.id);
  }

  /**
   * Clones the given commit in the given provider
   *
   * @param commit the commit to clone
   * @param upl the provider to which to clone the commit to, needed if there is more than one provider
   */
  public async cloneCommit(commit: Secured<Commit>, upl?: string): Promise<void> {
    upl = this.validateUpl(upl);

    const creator = async (uprtcl: EveesProvider) => {
      await uprtcl.cloneCommit(commit);
      return commit;
    };
    const cloner = async (uprtcl: EveesProvider, object: Secured<Commit>) => {
      await uprtcl.cloneCommit(object);
      return commit;
    };

    await this.service.optimisticCreateIn(upl, creator, cloner);
    this.logger.info('Cloned the commit: ', commit);
  }

  /** Modifiers */

  /**
   * Update the head of the given perspective to the given headId
   *
   * @param perspectiveId perspective to update
   * @param details new details of the perspective
   */
  public async updatePerspectiveDetails(
    perspectiveId: string,
    details: Partial<PerspectiveDetails>
  ): Promise<void> {
    const perspective: Secured<Perspective> | undefined = await this.get(perspectiveId);
    if (!perspective)
      throw new Error(
        `Error trying to fetch perspective with id ${perspectiveId}: failed to update details of perspective`
      );

    const provider = this.getPerspectiveProvider(perspective);

    const updater = (evees: EveesProvider) =>
      evees.updatePerspectiveDetails(perspectiveId, details);

    this.service.optimisticUpdateIn(
      provider.uprtclProviderLocator,
      perspective,
      updater,
      updater,
      `Update details of ${perspective.id}`,
      perspectiveId
    );
  }
}
