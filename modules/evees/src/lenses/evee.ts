import { LitElement, property, html, css } from 'lit-element';
import { ApolloClient, gql } from 'apollo-boost';

import { Secured, GraphQlTypes } from '@uprtcl/common';
import { moduleConnect } from '@uprtcl/micro-orchestrator';
  
export class Evee extends moduleConnect(LitElement) {
  @property({ type: Object })
  perspectiveId!: string;

  @property({ attribute: false })
  show: Boolean = false;

  firstUpdated() {
    this.addEventListener('checkout-perspective', this.checkout)
  }

  async load() {

    const data = getPerspectiveData(this.request(GraphQlTypes.Client), this.perspectiveId);
    const client: ApolloClient<any> = this.request(GraphQlTypes.Client);
    const result = await client.query({
      query: gql`{
        getEntity(id: "${this.perspectiveId}") {
          id
          content {
            id
          }
        }
      }`
    });
    console.log(result);
    const { text } = result.data.getEntity.content.entity;
    this.title = text ? text : 'Title goes here';
  }
  
  buttonClick() {
    this.load();
    this.show = true;
  }
  
  checkout() {
    
  }
  
  render() {
    return html`
      <div>
        <cortex-entity .hash=${this.dataId} lens="content">
          <evee-info slot="version-control" isOriginal perspectiveId=${this.perspectiveId ? "color:auto" : ''}></evee-info>
        </cortex-entity> 
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
