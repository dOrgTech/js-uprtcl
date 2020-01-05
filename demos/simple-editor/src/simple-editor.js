import { LitElement, html } from 'lit-element';
import { moduleConnect } from '@uprtcl/micro-orchestrator';
import { DocumentsModule } from '@uprtcl/documents';
import { EveesModule } from '@uprtcl/evees';

export class SimpleEditor extends moduleConnect(LitElement) {
  static get properties() {
    return {
      rootHash: { type: String }
    };
  }

  constructor() {
    super();
    this.perspectivePattern = this.requestAll(EveesModule.types.PerspectivePattern).find(
      p => p.create
    );
    this.textNodePattern = this.requestAll(DocumentsModule.types.TextNodeEntity).find(p => p.create);
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
    const docProvider = this.requestAll(DocumentsModule.types.DocumentsRemote).find(provider => {
      const regexp = new RegExp('^http');
      return !regexp.test(provider.uprtclProviderLocator);
    });

    const eveesProvider = this.requestAll(EveesModule.types.EveesRemote).find(provider => {
      const regexp = new RegExp('^http');
      return !regexp.test(provider.uprtclProviderLocator);
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
      const hashed = await this.textNodePattern.create()({}, docProvider.uprtclProviderLocator);

      const perspective = await this.perspectivePattern.create()(
        { dataId: hashed.id },
        eveesProvider.uprtclProviderLocator
      );
      window.history.pushState('', '', `/?id=${perspective.id}`);
    }
  }

  render() {
    return html`
      ${this.rootHash
        ? html`
            <cortex-entity .hash=${this.rootHash} lens-type="content"></cortex-entity>
          `
        : html`
            Loading...
          `}
    `;
  }
}
