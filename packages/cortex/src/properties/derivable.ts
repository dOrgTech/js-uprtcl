import { Property } from '../pattern';

export interface Derivable<T = any> extends Property<T> {
  derive: () => (object: any) => Promise<T>;
  extract: (derivedObject: T) => object;
}
