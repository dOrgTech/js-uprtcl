import { gql } from 'apollo-boost';

export const UPDATE_HEAD = gql`
  mutation UpdatePerspectiveHead($perspectiveId: ID!, $headId: ID!) {
    updatePerspectiveHead(perspectiveId: $perspectiveId, headId: $headId) {
      id
    }
  }
`;

export const CREATE_COMMIT = gql`
  mutation CreateCommit($dataId: ID!, $parentsIds: [ID!]!, $message: String, $usl: String) {
    createCommit(dataId: $dataId, parentsIds: $parentsIds, message: $message, usl: $usl) {
      id
    }
  }
`;

export const CREATE_PERSPECTIVE = gql`
  mutation CreatePerspective($headId: ID, $context: String, $usl: String) {
    createPerspective(headId: $headId, context: $context, usl: $usl) {
      id
    }
  }
`;
