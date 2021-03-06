import { interfaces } from 'inversify';
import { RequestDependencyEvent } from '../module-container';
import { Constructor, CustomElement, ReduxTypes } from '../../types';
import { ConnectedElement } from './module-connect.mixin';
import { Store } from 'redux';

export interface ReduxConnectedElement extends ConnectedElement {
  store: Store;

  stateChanged(state: any): void;
}

export const reduxConnect = <T extends Constructor<CustomElement>>(
  baseElement: T
): {
  new (...args: any[]): ReduxConnectedElement;
  prototype: any;
} & T =>
  class extends baseElement implements ReduxConnectedElement {
    store!: Store;

    private requestGeneric<T>(
      dependency: interfaces.ServiceIdentifier<T>,
      multiple: boolean = false
    ): T[][] {
      const event = new RequestDependencyEvent({
        detail: { request: [dependency], multiple: multiple },
        composed: true,
        bubbles: true
      });

      const resolved = this.dispatchEvent(event);

      if (
        resolved &&
        event.dependencies &&
        event.dependencies.length > 0 &&
        event.dependencies[0] &&
        event.dependencies[0][0]
      ) {
        return event.dependencies;
      } else {
        throw new Error(
          `Dependency ${String(dependency)} could not be loaded:
          make sure that this element is included inside a <module-container> super element`
        );
      }
    }

    request<T>(dependency: interfaces.ServiceIdentifier<T>): T {
      const deps = this.requestGeneric(dependency, false);
      return deps[0][0];
    }

    requestAll<T>(dependency: interfaces.ServiceIdentifier<T>): T[] {
      const deps = this.requestGeneric(dependency, true);
      return deps[0];
    }

    connectedCallback() {
      this.store = this.request(ReduxTypes.Store);

      super.connectedCallback();

      this.store.subscribe(() => this.stateChanged(this.store.getState()));
    }

    stateChanged(state: any) {}
  };
