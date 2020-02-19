import { makeExecutableSchema } from "graphql-tools";
import merge from "lodash.merge";

import recipeResolver from "./models/recipe/recipe.resolver";
import recipeTypeDef from "./models/recipe/recipe.typeDef";
import userResolver from "./models/user/user.resolver";
import userTypeDef from "./models/user/user.typeDef";

import { directiveTypeDefs, schemaDirectives } from "./directives";

/**
 * Create a base typeDef so other typeDefs can extend them later
 * Types cannot be empty, so we'll define something in each type
 * https://github.com/graphql/graphql-js/issues/937
 */
const baseTypeDef = /* GraphQL */ `
  type Query {
    _: Boolean
  }
  type Mutation {
    _: Boolean
  }
  type Subscription {
    _: Boolean
  }
`;

const typeDefs = [
  baseTypeDef,
  recipeTypeDef,
  userTypeDef,
  ...directiveTypeDefs,
];

const resolvers = merge(recipeResolver, userResolver);

const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
  schemaDirectives,
});

export default schema;
