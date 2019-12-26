import { LitElement, property, html, css } from 'lit-element';
import { ApolloClient, gql } from 'apollo-boost';
import { GraphQlTypes } from '@uprtcl/common';
import { moduleConnect } from '@uprtcl/micro-orchestrator';

export class WikiPage extends moduleConnect(LitElement) {
  @property({ type: String })
  pageHash!: string;

  @property({ type: String })
  title!: string;

  async firstUpdated() {
    const client: ApolloClient<any> = this.request(GraphQlTypes.Client);
    const result = await client.query({
      query: gql`{
        getEntity(id: "${this.pageHash}") {
          content {
            entity {
              ... on TextNode {
                text
                links
              }
            }
          }
        }
      }`
    });
    console.log(result);
    const pageNode = result.data.getEntity.content.entity;
    this.title = pageNode.text ? pageNode.text : 'Title goes here';
  }

  render() {
    return html`
      <div class="header">
        <div class="version-control">
          <evee-info perspectiveId=${this.pageHash}></evee-info>
        </div>
        <div class="page">
          <h3>${this.title}</h3>
        </div>
      </div>
      <cortex-entity .hash=${this.pageHash} lens="evee"> </cortex-entity>
    `;
  }

  static get styles() {
    return css`
      .header {
        display: flex;
        flex-direction: row;
      }
      .page {
        text-align: left;
      }
      .actions {
      }
    `;
  }
}
