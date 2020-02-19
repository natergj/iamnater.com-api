import { DynamoDB } from "aws-sdk";
import { ApolloError } from "apollo-server-lambda";

export default {
  Query: {
    hello: () => {
      return "Hello GraphQL Lambda CloudFormation!";
    },
    recipes: async (_, __, { db }) => {
      const recipe: any = await db.scan({ TableName: "Recipes" }).promise();
      return recipe.Items.map((item: any) => DynamoDB.Converter.unmarshall(item)).sort((a, b) =>
        a.Title.localeCompare(b.Title),
      );
    },
    recipeById: async (_, { id }, { db }) => {
      const recipe: any = await db.getItem({ TableName: "Recipes", Key: { Id: { S: id } } }).promise();
      return DynamoDB.Converter.unmarshall(recipe.Item);
    },
    user: async (_, __, ctx) => {
      if (ctx.currentUser) {
        return ctx.currentUser;
      }
      else {
        throw new ApolloError("Unauthorized", "401");
      }
    }
  },
  Recipe: {
    id: (recipe: any) => recipe.Id,
    title: (recipe: any) => recipe.Title,
    ingredients: recipe => recipe.Ingredients,
    instructions: recipe => recipe.Instructions,
    unformatted: recipe => recipe.Unformatted,
    description: recipe => recipe.Description,
    uploads: recipe => recipe.Uploads ? recipe.Uploads : [],
  },
  Ingredient: {
    name: ingredient => ingredient.Name,
    measure: ingredient => ingredient.Measure,
    amount: ingredient => ingredient.Quantity,
  },
  User: {
    id: user => user.Id,
    name: user => user.Name,
    email: user => user.Email,
    roles: user => user.Roles || [],
  }
};
