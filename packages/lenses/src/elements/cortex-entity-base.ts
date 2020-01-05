import { ApolloClient, gql } from 'apollo-boost';
import { flatMap } from 'lodash-es';
import { LitElement, property, PropertyValues } from 'lit-element';

import { moduleConnect, Dictionary } from '@uprtcl/micro-orchestrator';
import { ApolloClientModule } from '@uprtcl/common';
import { Hashed } from '@uprtcl/cortex';

import { Lens } from '../types';
import { SlotPlugin } from '../plugins/slot.plugin';

export class CortexEntityBase extends moduleConnect(LitElement) {
  @property()
  public hash!: string;

  @property({ attribute: 'lens-type' })
  public lensType!: string;

  @property({ type: Object })
  protected entity!: Hashed<any>;

  // Lenses
  @property({ attribute: false })
  protected selectedLens!: Lens | undefined;

  connectedCallback() {
    super.connectedCallback();

    this.addEventListener('entity-updated', () => this.loadEntity(this.hash));
    this.addEventListener<any>(
      'lens-selected',
      (e: CustomEvent) => (this.selectedLens = e.detail.selectedLens)
    );
  }

  async loadEntity(hash: string): Promise<void> {
    this.selectedLens = undefined;

    const client: ApolloClient<any> = this.request(ApolloClientModule.types.Client);

    // We are also loading the content to have it cached in case the lens wants it
    const result = await client.query({
      query: gql`
      {
        entity(id: "${hash}", depth: 1) {
          id
          _patterns {
            isomorphisms {
              _patterns {
                lenses {
                  name
                  type
                  render
                }
              }
            }
          }
        }
      }
      `
    });

    const lenses = flatMap(
      result.data.entity._patterns.isomorphisms,
      iso => iso._patterns.lenses
    ).filter(lens => !!lens);

    this.entity = { id: result.data.id, ...result.data.entity };

    if (this.lensType) {
      this.selectedLens = lenses.find(lens => lens.type === this.lensType);
    }

    if (this.selectedLens === undefined) {
      this.selectedLens = lenses[0];
    }
  }

  get slotPlugins(): Dictionary<SlotPlugin> {
    return {};
  }

  updated(changedProperties: PropertyValues) {
    super.updated(changedProperties);

    if (changedProperties.has('hash') && this.hash && this.hash !== changedProperties.get('hash')) {
      this.loadEntity(this.hash);
    }
  }
}
