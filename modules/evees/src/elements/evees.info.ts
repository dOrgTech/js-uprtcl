import { LitElement, property, html, css } from 'lit-element';

import { moduleConnect } from '@uprtcl/micro-orchestrator';
import { ApolloClient } from 'apollo-boost';
import { GraphQlTypes } from '@uprtcl/common';
import { getPerspectiveData } from '../graphql.queries';
import { PerspectiveData } from '../types';

export class EveeInfo extends moduleConnect(LitElement) {
  @property({ type: String })
  perspectiveId!: string;

  @property({ attribute: false })
  show: Boolean = false;

  perspectiveData!: PerspectiveData;

  firstUpdated() {
    this.load();
  }

  infoBoxId():string {
    return `info-box-${this.perspectiveId}`
  }

  documentClick(event) {
    console.log('[EVEE-INDO] documentClick', event);
    if (this.contains(event.target) && event.target.closest(`#${this.infoBoxId}`) === null) {
      this.show = false;
      document.removeEventListener('click', this.documentClick);
    }
  }

  updated() {
    this.load();
  }

  async load() {
    const client: ApolloClient<any> = this.request(GraphQlTypes.Client);
    this.perspectiveData = await getPerspectiveData(client, this.perspectiveId);

    console.log('[EVEE-INFO] load', { perspectiveData: this.perspectiveData });
  }

  showClicked() {
    this.show = true;
    document.addEventListener('click', this.documentClick);
  }

  renderLoading() {
    return html`
      loading perspective data ...<mwc-circular-progress></mwc-circular-progress>
    `;
  }

  render() {
    return html`
      <div class="container">
        <div class="button" @click=${this.showClicked}></div>
        ${this.show
          ? html`
              <div id=${this.infoBoxId()} class="info-box">
                ${this.perspectiveData
                  ? html`
                      name: ${this.perspectiveData.details.name} origin:
                      ${this.perspectiveData.perspective.origin}
                    `
                  : this.renderLoading()}
              </div>
            `
          : ''}
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
