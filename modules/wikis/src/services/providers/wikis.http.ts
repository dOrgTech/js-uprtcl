import { HttpConnection, HttpProvider } from '@uprtcl/connections';
import { Hashed } from '@uprtcl/cortex';

import { WikisProvider } from '../wikis.provider';
import { Wiki } from '../../types';

const wikis_api: string = 'wikinode-v1';

export class WikisHttp extends HttpProvider implements WikisProvider {
  constructor(host: string, protected connection: HttpConnection) {
    super(
      {
        host: host,
        apiId: wikis_api
      },
      connection
    );
  }

  async get<T>(hash: string): Promise<Hashed<T>> {
    const object = await super.getObject<T>(`/get/${hash}`);
    return {
      id: hash,
      object: object
    };
  }

  async createWiki(wiki: Wiki, hash: string): Promise<string> {
    const result = await super.post(`/data`, {
      id: hash,
      object: wiki
    });
    return result.elementIds[0];
  }
}
