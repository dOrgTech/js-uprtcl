import { injectable } from 'inversify';

import { DiscoverableSource, SourceProvider } from '@uprtcl/cortex';
import { ReduxCortexModule } from '@uprtcl/common';

import { WikiNodeLens } from './lenses/wiki-node.lens';
import { WikiNodePattern } from './patterns/wiki-node.pattern';
import { WikiNodeEntity } from './patterns/wiki-node.entity';
import { WikisTypes } from './types';
import { WikisProvider } from './services/wikis.provider';
import { WikisLocal } from './services/wikis.local';
import { Wikis } from './services/wikis';
import { WikisRemote } from './services/wikis.remote';

/**
 * Configure a wikis module with the given providers
 *
 * Depends on: lensesModule, PatternsModule, discoveryModule
 *
 * Example usage:
 *
 * ```ts
 * import { IpfsConnection } from '@uprtcl/connections';
 * import { wikisModule, WikisTypes, WikisIpfs } from '@uprtcl/wikis';
 *
 * const ipfsConnection = new IpfsConnection({
 *   host: 'ipfs.infura.io',
 *   port: 5001,
 *   protocol: 'https'
 * });
 *
 *  const wikisProvider = new wikisIpfs(ipfsConnection);
 *
 * const docs = wikisModule([{ service: WikisProvider }]);
 * await orchestrator.loadModules({
 *   id: WikisTypes.Module,
 *   module: docs
 * });
 * ```
 *
 * @category CortexModule
 *
 * @param wikisRemote an array of remotes of wikis
 * @param wikisLocal the local cache service to
 * @returns a configured wikis module ready to be loaded
 */
export function wikisModule(
  wikisRemotes: DiscoverableSource<WikisRemote>[],
  wikisLocal: new (...args: any[]) => WikisProvider = WikisLocal
): new (...args: any[]) => ReduxCortexModule {
  @injectable()
  class WikisModule extends ReduxCortexModule {
    get sources() {
      return wikisRemotes.map(remote => ({
        symbol: WikisTypes.WikisRemote,
        source: remote
      }));
    }

    get services() {
      return [
        { symbol: WikisTypes.WikisLocal, service: wikisLocal },
        { symbol: WikisTypes.Wikis, service: Wikis }
      ];
    }

    get elements() {
      return [{ name: 'basic-wiki', element: WikiNodeLens }];
    }

    get patterns() {
      return [
        { symbol: WikisTypes.WikiPattern, pattern: WikiNodePattern },
        { symbol: WikisTypes.WikiEntity, pattern: WikiNodeEntity }
      ];
    }
  }

  return WikisModule;
}
