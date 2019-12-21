import { ApolloClient, gql } from 'apollo-boost';
import { LitElement, property, html, css } from 'lit-element';

import { CortexTypes, PatternRecognizer } from '@uprtcl/cortex';
import { GraphQlTypes, PermissionsStatus } from '@uprtcl/common';
import { moduleConnect } from '@uprtcl/micro-orchestrator';

import { PerspectiveDetails, PerspectiveData } from '../types';

export class PerspectivesList extends moduleConnect(LitElement) {
  @property({ type: String })
  rootPerspectiveId!: string;

  @property({ attribute: false })
  perspectivesData: Array<PerspectiveData> = [];

  private recognizer!: PatternRecognizer;

  async firstUpdated() {
    this.recognizer = this.request(CortexTypes.Recognizer);
    this.updatePerspectivesData();
  }

  updatePerspectivesData = async () => {
    try {
      const client: ApolloClient<any> = this.request(GraphQlTypes.Client);
      const result = await client.query({
        query: gql`{
          getEntity(id: "${this.rootPerspectiveId}") {
            id
            entity {
              ... on Perspective {
                context {
                  perspectives {
                    id
                    entity {
                      ... on Perspective {
                        name
                        head
                        context {
                          identifier
                        }
                        payload {
                          origin
                          creatorId
                          timestamp
                        }
                      }
                    }
                  }
                } 
              } 
            } 
          }
        }`
      });
      const { perspectives } = result.data.getEntity.entity.context;
      const fillPerspectives = perspective => {
        const { head, context, name, payload } = perspective.entity;
        const permissions: PermissionsStatus = {
          canWrite: false
        };
        const details: PerspectiveDetails = {
          headId: head,
          context: context.identifier,
          name
        };
        return {
          id: perspective.id,
          details,
          perspective: payload,
          permissions
        };
      };

      this.perspectivesData = perspectives.map(fillPerspectives);
      console.log(`[PERSPECTIVE-LIST] updatePerspectivesData`, {
        perspectivesData: JSON.stringify(this.perspectivesData)
      });
    } catch (e) {
      console.log(e);
    }
  };

  stateChanged(state) {
    /** update canWrite */
    this.perspectivesData.forEach(perspectiveData => {
      perspectiveData.permissions = {
        canWrite: true
      };
    });
    this.perspectivesData = [...this.perspectivesData];
    console.log(`[PERSPECTIVE-LIST] stateChanged`, { perspectivesData: this.perspectivesData });
  }

  openPerspective = id => {
    //crear evento para manejar id de perspectiva, en vez de en el url
    window.history.pushState('', '', `/?id=${id}`);
  };

  renderPerspective(perspectiveData: PerspectiveData) {
    const style = perspectiveData.id == this.rootPerspectiveId ? 'font-weight: bold;' : '';
    return html`
      <li style=${style} @click=${() => this.openPerspective(perspectiveData.id)}>
        ${perspectiveData.details.name} - Creator: ${perspectiveData.perspective.creatorId} -
        ${perspectiveData.permissions.canWrite ? `merge` : ``};
      </li>
    `;
  }

  render() {
    return html`
      <h4>Perspectives</h4>
      ${this.perspectivesData.length > 0
        ? html`
            <ul>
              ${this.perspectivesData.map(perspectivesData => {
                return this.renderPerspective(perspectivesData);
              })}
            </ul>
          `
        : ''}
    `;
  }
}
