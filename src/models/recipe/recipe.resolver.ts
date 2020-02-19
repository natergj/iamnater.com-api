import { DynamoDB } from "aws-sdk";

export default {
  Query: {
    recipes: async (_, __, { db }) => {
      const recipes: any = await db.scan({ TableName: "Recipes" }).promise();
      console.log(recipes);
      return recipes.Items.map((item: any) => DynamoDB.Converter.unmarshall(item)).sort((a, b) =>
        a.Title.localeCompare(b.Title),
      );
    },
    recipeById: async (_, { id }, { db }) => {
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
    uploads: recipe => recipe.Uploads ? recipe.Uploads : [],
  },
  Ingredient: {
    name: ingredient => ingredient.Name,
    measure: ingredient => ingredient.Measure,
    amount: ingredient => ingredient.Quantity,
  },
};
