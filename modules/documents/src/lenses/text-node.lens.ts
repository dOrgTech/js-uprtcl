import { LitElement, property, html, css } from 'lit-element';

import { TextNode, TextType } from '../types';

export class TextNodeLens extends LitElement {
  @property({ type: Object })
  data!: TextNode;

  @property()
  editable!: boolean;

  lastChangeTimeout: any;
  lastText!: string;

  get currentContent(): TextNode {
    const data = { ...this.data };
    if (this.lastText) data.text = this.lastText;

    return data;
  }

  connectedCallback() {
    super.connectedCallback();

    this.addEventListener('keypress', e => {
      const key = e.which || e.keyCode;
      // 13 is enter
      if (key === 13) {
        e.preventDefault();
        e.stopPropagation();

        this.dispatchEvent(
          new CustomEvent('create-child', {
            detail: {
              parent: this.currentContent
            },
            composed: true,
            bubbles: true
          })
        );
      }
    });
  }

  render() {
    return html`
      <div class="container">
        <div class="top-row">
          <div class="version-control">
            <slot name="version-control"></slot>
          </div>

          <div class="content">
            ${this.data.type === TextType.Paragraph
              ? html`
                  <div
                    contenteditable=${this.editable ? 'true' : 'false'}
                    @input=${e => e.target && this.textInput(e.target['innerText'])}
                  >
                    ${this.data.text}
                  </div>
                `
              : html`
                  <h3
                    contenteditable=${this.editable ? 'true' : 'false'}
                    @input=${e => e.target && this.textInput(e.target['innerText'])}
                  >
                    ${this.data.text}
                  </h3>
                `}
          </div>

          <div class="plugins">
            <slot name="plugins"></slot>
          </div>

        </div>
        <div class="children-row">
          ${this.data.links.map(
            link => html`
              <cortex-entity .hash=${link} lens="evee" context></cortex-entity>
            `
          )}
        </div>
      </div>
    `;
  }

  static get styles() {
    return css`
      .top-row {
        display: flex;
        flex-direction: row;
        min-height: 1.5rem;
      }

      .children-row {
        width: 100%;
      }
    `;
  }

  textInput(content: string) {
    if (this.lastChangeTimeout) {
      clearTimeout(this.lastChangeTimeout);
    }

    this.lastText = content;

    this.lastChangeTimeout = setTimeout(() => this.updateContent(), 2000);
  }

  updateContent() {
    this.dispatchEvent(
      new CustomEvent('content-changed', {
        detail: { newContent: this.currentContent },
        bubbles: true,
        composed: true
      })
    );
  }
}
