import dotenv from "dotenv";
dotenv.config();

import AWS from "aws-sdk";
import { ApolloServer } from "apollo-server-lambda";
import typeDefs from "./typeDefs";
import resolvers from "./resolvers";
import context from "./context";

if (process.env.RUNTIME_ENV === "local") {
  AWS.config.logger = console;
}

const server = new ApolloServer({ typeDefs, resolvers, context });

export const graphqlHandler = server.createHandler({
  cors: {
    origin: [
      "https://www.iamnater.com",
      "https://iamnater.com",
      "http://localhost:8080",
      "http://home.local:8080",
      "http://www.iamnater.com.s3-website.us-east-2.amazonaws.com",
    ],
    credentials: true,
  },
});
