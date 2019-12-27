import { ApolloClient, gql } from 'apollo-boost';
import { PermissionsStatus } from '@uprtcl/common';
import { PerspectiveDetails, PerspectiveData } from './types';

export const getPerspectiveData = async (
  client: ApolloClient<any>,
  perspectiveId: string
): Promise<PerspectiveData> => {
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

  const { head, context, name, payload } = result.data.getEntity.entity;
  
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
