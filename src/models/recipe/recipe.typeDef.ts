import { gql } from "apollo-server-lambda";

export default gql`
  extend type Query {
    """
    Get a list of recipes
    """
    recipes: [Recipe]!

    """
    Get details about a specific recipe given the ID
    """
    recipeById(id: ID!): Recipe
  }

  type Recipe {
    """
    Unique ID for recipe
    """
    id: ID!

    """
    Short description about the recipe
    """
    description: String

    """
    Instructions on how to make the recipe
    """
    instructions: String

    """
    Unformatted instructions on how to make the recipe
    """
    unformatted: String

    """
    Recipe title
    """
    title: String

    """
    An array of the recipe ingredients
    """
    ingredients: [Ingredient]

    """
    Picture uploads
    """
    uploads: [FileUpload]
  }

  type Ingredient {
    """
    Decimal representation of measure units
    """
    amount: Float

    """
    Basic unit of measure
    """
    measure: Measure

    """
    The ingredient's name
    """
    name: String
  }

  input IngredientInput {
    """
    Decimal representation of measure units
    """
    amount: Float

    """
    Basic unit of measure
    """
    measure: Measure

    """
    The ingredient's name
    """
    ingredient: String
  }

  enum Measure {
    cup
    teaspoon
    tablespoon
    ounce
    fluid_ounce
    gram
    pound
    pkg
  }

  type FileUpload {
    id: ID!
    fileName: String
    filePath: String
    size: Int
    encoding: String
    extension: String
    uploadedBy: User
    updatedBy: User
    updatedOn: String
  }
`;
