import { interfaces } from 'inversify';
import { Constructor } from '../types';

export interface MicroModule {
  onLoad(
    context: interfaces.Context,
    bind: interfaces.Bind,
    unbind: interfaces.Unbind,
    isBound: interfaces.IsBound,
    rebind: interfaces.Rebind
  ): Promise<void>;

  onUnload(): Promise<void>;

  submodules?: Constructor<MicroModule>[];
}
