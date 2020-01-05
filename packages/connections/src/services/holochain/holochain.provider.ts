import { Hashed } from '@uprtcl/cortex';
import { ServiceProvider } from '@uprtcl/multiplatform';

import { HolochainConnection } from './holochain.connection';

export interface HolochainProviderOptions {
  instance: string;
  zome: string;
  getMyAddress: {
    instance: string;
    zome: string;
    funcName: string;
  };
}

// Auxiliar type for Holochain's get_entry call
export type EntryResult<T extends object = any> = {
  entry: Hashed<T>;
  type: string;
};

export abstract class HolochainProvider implements ServiceProvider {
  uprtclProviderLocator!: string;

  userAddress!: string;

  constructor(
    protected hcOptions: HolochainProviderOptions,
    protected connection: HolochainConnection
  ) {}

  public getMyAddress(): Promise<string> {
    const { instance, zome, funcName } = this.hcOptions.getMyAddress;
    return this.connection.call(instance, zome, funcName, {});
  }

  get userId() {
    return this.userAddress;
  }

  /**
   * @override
   */
  public async ready() {
    await this.connection.ready();
    this.userAddress = await this.getMyAddress();
  }

  public async call(funcName: string, params: any): Promise<any> {
    return this.connection.call(this.hcOptions.instance, this.hcOptions.zome, funcName, params);
  }

  public parseResponse(response: { Ok: any } | any): any {
    return response.hasOwnProperty('Ok') ? response.Ok : response;
  }

  public parseEntry<T extends object>(entry: { Ok: any } | any): T {
    return JSON.parse(this.parseResponse(entry).App[1]);
  }

  public parseEntryResult<T extends object>(entry: any): EntryResult<T> | undefined {
    entry = this.parseResponse(entry);
    if (!entry.result.Single.meta) return undefined;
    return {
      entry: {
        id: entry.result.Single.meta.address,
        object: this.parseEntry<T>(entry.result.Single.entry)
      },
      type: entry.result.Single.meta.entry_type.App
    };
  }

  public parseEntries<T extends object>(entryArray: Array<any>): Array<T> {
    return entryArray.map(entry => this.parseEntry(entry));
  }

  public parseEntriesResults<T extends object>(entryArray: Array<any>): Array<EntryResult<T>> {
    return entryArray
      .map(entry => this.parseEntryResult<T>(this.parseResponse(entryArray)))
      .filter(entry => entry != undefined) as Array<EntryResult<T>>;
  }
}
