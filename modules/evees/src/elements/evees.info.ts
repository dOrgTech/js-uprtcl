import { LitElement, property, html, css } from 'lit-element';

import { moduleConnect } from '@uprtcl/micro-orchestrator';
import { ApolloClient } from 'apollo-boost';
import { GraphQlTypes } from '@uprtcl/common';
import { getPerspectiveDetails } from 'src/graphql.queries';
import { PerspectiveDetails } from 'src/types';

export class EveeInfo extends moduleConnect(LitElement) {
  
  @property({ type: String })
  perspectiveId!: string;

  @property({ attribute: false })
  show: Boolean = false;

  @property({ attribute: false })
  perspectiveDetails!: PerspectiveDetails;

  firstUpdated() {
    this.load();
  }

  updated() {
    this.load();
  }

  async load() {
    const client: ApolloClient<any> = this.request(GraphQlTypes.Client);
    this.perspectiveDetails = await getPerspectiveDetails(client, this.perspectiveId);

    console.log('[EVEE-INFO] load', {perspectiveId: this.perspectiveId});
  }

  showClicked() {
    this.show = !this.show;
  }

  render() {
    return html`
      <div class="container">
        <div class="button" @click=${this.showClicked}></div>
        ${this.show ? html`<div class="info-box"></div>` : ''}
      </div>
    `;
  }

  static get styles() {
    return css`
      .container {
        position: relative;
      }
      .button {
        width: 10px;
        min-height: 40px;
        background-color: #9fc5e8ff;
      }
      .info-box {
        position: absolute;
        right: -300px;
        top: 0;
        width: 300px;
        min-height: 300px;
        background-color: white;
        box-shadow: 4px;
      }
    `;
  }
}
