import { multiInject, injectable, inject } from 'inversify';

import {
  DiscoverableSource,
  KnownSourcesService,
  DiscoveryTypes,
  PatternTypes,
  PatternRecognizer,
  Creatable,
  CachedMultiSourceService,
  Hashed,
  IsSecure,
  MultiSourceService
} from '@uprtcl/cortex';
import { Logger } from '@uprtcl/micro-orchestrator';
import { Secured } from '@uprtcl/common';

import { WikisLocal, WikisTypes, WikiNode } from '../types';
import { WikisRemote } from './wikis.remote';
import { WikisProvider } from './wikis.provider';

@injectable()
export class Wikis {
  logger = new Logger('wikis');

  service: CachedMultiSourceService<WikisLocal, WikisRemote>;

  constructor(
    @inject(PatternTypes.Recognizer) protected patternRecognizer: PatternRecognizer,
    @inject(DiscoveryTypes.LocalKnownSources)
    protected knownSources: KnownSourcesService,
    @inject(WikisTypes.WikisLocal)
    protected WikisLocal: WikisLocal,
    @multiInject(WikisTypes.WikisRemote)
    protected WikisRemotes: DiscoverableSource<WikisRemote>[]
  ) {
    this.service = new CachedMultiSourceService<WikisLocal, WikisRemote>(
      WikisLocal,
      new MultiSourceService<WikisRemote>(patternRecognizer, knownSources, WikisRemotes)
    );
  }

  /**
   * @override
   */
  public ready(): Promise<void> {
    return this.service.ready();
  }

  /** Getters */

  /**
   * @override
   */
  public get<T extends object>(hash: string): Promise<Hashed<T> | undefined> {
    return this.service.get(hash);
  }

  /**
   * Clones the given textnode in the given provider
   *
   * @param node the text node to clone
   * @param providerName the provider to which to clone the text node to, needed if there is more than one provider
   */
  public async createWikiNode(node: WikiNode, upl?: string): Promise<Hashed<WikiNode>> {
    const creator = async (docs: WikisProvider) => {
      const hash = await docs.createWikiNode(node);
      return {
        id: hash,
        object: node
      };
    };

    const cloner = async (docs: WikisProvider, hashedNode: Hashed<WikiNode>) => {
      const hash = await docs.createWikiNode(hashedNode.object, hashedNode.id);
      return {
        id: hash,
        object: node
      };
    };

    const hashedNode = await this.service.optimisticCreateIn(upl, creator, cloner);

    this.logger.info('Cloned wikinode: ', hashedNode);
    return hashedNode;
  }
}