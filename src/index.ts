import { ApolloServer, gql } from "apollo-server-lambda";

const typeDefs = gql`
  type Query {
    hello: String
  }
`;

const resolvers = {
  Query: {
    hello: () => "Hello GraphQL Lambda CloudFormation!",
  },
};

const server = new ApolloServer({ typeDefs, resolvers });

export const graphqlHandler = server.createHandler({
  cors: {
    origin: ["https://www.iamnater.com", "https://iamnater.com", "http://localhost:8080"],
    credentials: true,
  }
});
