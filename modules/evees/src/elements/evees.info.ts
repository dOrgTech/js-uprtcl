import { LitElement, property, html, css } from 'lit-element';

import { moduleConnect } from '@uprtcl/micro-orchestrator';

export class EveeInfo extends moduleConnect(LitElement) {
  
  @property({ type: String })
  perspectiveId!: String;

  firstUpdated() {
    this.load();
  }

  updated() {
    this.load();
  }

  async load() {
    console.log('[EVEE-INFO] load', {perspectiveId: this.perspectiveId});
  }

  render() {
    return html`
      <div>
        <button class="button"></button>
      </div>
    `;
  }

  static get styles() {
    return css`
      .button {
        width: 10px;
        background-color: #9fc5e8ff;
      }
    `;
  }
}
