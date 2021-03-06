import { LitElement, html } from 'lit-element';
import { moduleConnect } from '@uprtcl/micro-orchestrator';
import { EveesTypes } from '@uprtcl/evees';
import { DocumentsTypes } from '@uprtcl/documents';

export class SimpleEditor extends moduleConnect(LitElement) {
  static get properties() {
    return {
      rootHash: { type: String }
    };
  }

  constructor() {
    super();
    this.perspectivePattern = this.request(EveesTypes.PerspectivePattern);
    this.textNodePattern = this.request(DocumentsTypes.TextNodePattern);
  }

  subscribeToHistory(history, callback) {
    const pushState = history.pushState;
    history.pushState = function(state) {
      if (typeof history.onpushstate == 'function') {
        history.onpushstate({ state: state });
      }
      callback(arguments);
      // Call your custom function here
      return pushState.apply(history, arguments);
    };
  }

  async firstUpdated() {
    const docProvider = this.requestAll(DocumentsTypes.DocumentsRemote)
    .find(provider => {
      const regexp = new RegExp('^http');
      return regexp.test(provider.service.uprtclProviderLocator);
    });

    const eveesProvider = this.requestAll(EveesTypes.EveesRemote)
    .find(provider => {
      const regexp = new RegExp('^http');
      return regexp.test(provider.service.uprtclProviderLocator);
    });

    
    window.addEventListener('popstate', () => {
      this.rootHash = window.location.href.split('id=')[1];
    });
    this.subscribeToHistory(window.history, state => {
      this.rootHash = state[2].split('id=')[1];
    });

    if (window.location.href.includes('?id=')) {
      this.rootHash = window.location.href.split('id=')[1];
    } else {
      const hashed = await this.textNodePattern.create(
        {},
        docProvider.service.uprtclProviderLocator
      );

      const perspective = await this.perspectivePattern.create(
        { dataId: hashed.id },
        eveesProvider.service.uprtclProviderLocator
      );
      window.history.pushState('', '', `/?id=${perspective.id}`);
    }
    document.getElementById('');
  }

  render() {
    return html`
      ${this.rootHash
        ? html`
            <cortex-entity .hash=${this.rootHash}></cortex-entity>
          `
        : html`
            Loading...
          `}
    `;
  }
}
