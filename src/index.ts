import { ApolloServer } from "apollo-server-lambda";
import AWS, { DynamoDB } from "aws-sdk";
import dotenv from "dotenv";
import typeDefs from "./typeDefs";
dotenv.config();

const dynamoDbConfig: any = {
  region: "us-east-2",
};
if (process.env.RUNTIME_ENV === "production") {
  dynamoDbConfig.accessKeyId = process.env.DYNAMO_DB_API_KEY;
  dynamoDbConfig.secretAccessKey = process.env.DYNAMO_DB_API_SECRET;
}
if (process.env.RUNTIME_ENV === "local") {
  AWS.config.logger = console;
  dynamoDbConfig.endpoint = process.env.DYNAMO_DB_ENDPOINT;
}

const db = new DynamoDB(dynamoDbConfig);

const resolvers = {
  Query: {
    hello: () => {
      return "Hello GraphQL Lambda CloudFormation!";
    },
    recipes: async () => {
      const recipe: any = await db.scan({ TableName: "Recipes" }).promise();
      return recipe.Items.map((item: any) => DynamoDB.Converter.unmarshall(item)).sort((a, b) =>
        a.Title.localeCompare(b.Title),
      );
    },
    recipeById: async (_, { id }) => {
      const recipe: any = await db.getItem({ TableName: "Recipes", Key: { Id: { S: id } } }).promise();
      return DynamoDB.Converter.unmarshall(recipe.Item);
    },
  },
  Recipe: {
    id: (recipe: any) => recipe.Id,
    title: (recipe: any) => recipe.Title,
    ingredients: recipe => recipe.Ingredients,
    instructions: recipe => recipe.Instructions,
    unformatted: recipe => recipe.Unformatted,
    description: recipe => recipe.Description,
  },
  Ingredient: {
    name: ingredient => ingredient.Name,
    measure: ingredient => ingredient.Measure,
    amount: ingredient => ingredient.Quantity,
  },
};

const server = new ApolloServer({ typeDefs, resolvers });

export const graphqlHandler = server.createHandler({
  cors: {
    origin: [
      "https://www.iamnater.com",
      "https://iamnater.com",
      "http://localhost:8080",
      "http://www.iamnater.com.s3-website.us-east-2.amazonaws.com",
    ],
    credentials: true,
  },
});
