import { LitElement, property, html, css } from 'lit-element';

import { Secured } from '@uprtcl/common';
import { moduleConnect } from '@uprtcl/micro-orchestrator';

import { selectPerspectiveHeadId, selectEvees } from '../state/evees.selectors';
import { Commit, Perspective } from '../types';

export class Evee extends moduleConnect(LitElement) {
  
  @property({ type: Object })
  perspective!: Secured<Perspective>;

  @property({ attribute: false })
  commit!: Commit;

  @property({ attribute: false })
  show: Boolean = false;

  firstUpdated() {
    this.initialLoad();
  }

  async initialLoad() {
    const state = this.store.getState();
    const headId = selectPerspectiveHeadId(this.perspective.id)(selectEvees(state));
    if (headId === undefined) return;
    this.commit = selectById(headId)(state) as Commit;
  }

  render() {
    return html`
      <div>
        <button class="button"></button>
        ${this.show ? html`<div class="info-box"></div>` : ''}
      </div>
    `;
  }

  static get styles() {
    return css`
      .button {
        width: 10px;
        background-color: #9fc5e8ff;
      }

      .info-box {
        display: flex;
        flex-direction: row;
      }
    `;
  }
}
