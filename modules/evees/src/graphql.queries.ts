import { ApolloClient, gql } from 'apollo-boost';
import { PermissionsStatus } from '@uprtcl/common';
import { PerspectiveDetails } from './types';

export const getPerspectiveDetails = async (
  client: ApolloClient<any>,
  perspectiveId: string
): Promise<PerspectiveDetails> => {
  const result = await client.query({
    query: gql`{
      getEntity(id: "${perspectiveId}") {
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
    }`
  });

  const { perspective } = result.data.getEntity.entity;
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
    id: perspectiveId,
    details,
    perspective: payload,
    permissions
  };
};
