import { LitElement, property, html, css } from 'lit-element';
import { ApolloClient, gql } from 'apollo-boost';

import { GraphQlTypes, Secured } from '@uprtcl/common';
import { moduleConnect } from '@uprtcl/micro-orchestrator';

import { Perspective } from '../types';

export class Evee extends moduleConnect(LitElement) {
  @property({ type: Object })
  perspective!: Secured<Perspective>;

  @property({ attribute: false })
  dataId!: String;

  firstUpdated() {
    console.log('[EVEE-LENS] firstUpdated()', this.perspective);
    this.load();
  }

  updated() {
    console.log('[EVEE-LENS] updated()', this.perspective);
    this.load();
  }

  async load() {
    if (!this.perspective) return;
    
    const client: ApolloClient<any> = this.request(GraphQlTypes.Client);
    const result = await client.query({
      query: gql`{
        getEntity(id: "${this.perspective.id}") {
          id
          content {
            id
          }
        }
      }`
    });
    console.log('[EVEE-LENS] load()', result);
    this.dataId = result.data.getEntity.content.id;
  }

  renderLoadingPlaceholder() {
    return html`
      loading data ...<mwc-circular-progress></mwc-circular-progress> 
    `;
  }
  
  render() {
    console.log(`[EVEE-LENS] render() `, { dataId: this.dataId, perspectiveId:this.perspective.id })
    return html`
      ${!this.dataId
        ? this.renderLoadingPlaceholder()
        : html`
            <div>
        <cortex-entity .hash=${this.dataId} lens="content">
          <evee-info slot="version-control" perspectiveId=${this.perspective.id}></evee-info>
        </cortex-entity> 
      </div>
          `}
    `;
  }

  static get styles() {
    return css`
    `;
  }
}
