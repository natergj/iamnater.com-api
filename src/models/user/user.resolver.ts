import { ApolloError } from "apollo-server-lambda";
import { DynamoDB } from "aws-sdk";

export default {
  Query: {
    user: async (_, __, ctx) => {
      if (ctx.currentUser) {
        return ctx.currentUser;
      } else {
        throw new ApolloError("Unauthorized", "401");
      }
    },
  },
  Mutation: {
    addUserRoles: async (_, { userId, roles }, { db }) => {
      const updated = await db.updateItem({
        TableName: "Users",
        ReturnValues: "ALL_OLD",
        Key: {
          Id: { S: userId },
        },
        ExpressionAttributeNames: {
          "#R": "Roles"
        },
        ExpressionAttributeValues: {
          ":r": {
            SS: roles
          },
        },
        UpdateExpression: "ADD #R :r "
      }).promise();
      return true;
    },
  },
  User: {
    id: user => user.Id,
    name: user => user.Name,
    email: user => user.Email,
    roles: user => user.Roles || [],
  },
};
