import { gql } from 'apollo-boost';
import { Wikis } from '../services/wikis';
import { WikiTypes } from 'src/types';

export const wikiTypeDefs = gql`
  type Wiki implements Entity {
    id: ID!

    title: String!
    pages: [Entity!]!

    _patterns: Patterns!
    _meta: Metadata!
  }

  input WikiInput {
    title: String!
    pages: [ID!]!
  }

  extend type Mutation {
    createWiki(content: WikiInput!, usl: String): Wiki!
  }
`;

export const resolvers = {
  Mutation: {
    async createWiki(_, { content, usl }, { container }) {
      const wikis: Wikis = container.get(WikiTypes.Wikis);
      const { id, object } = await wikis.createWiki(content, usl);

      return { id, ...object };
    }
  }
};
/* 
export const wikisSchema = makeExecutableSchema({
  typeDefs: [baseTypeDefs, wikiTypeDefs],
  resolvers: baseResolvers
});
 */
