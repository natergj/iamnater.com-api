import { ApolloError } from "apollo-server-lambda";
import { SchemaDirectiveVisitor } from "graphql-tools";
import { defaultFieldResolver } from "graphql";

export const typeDef = /* GraphQL */ `
  directive @auth(
    requires: UserRole = ADMIN
    allowSelf: Boolean = false
  ) on OBJECT | FIELD_DEFINITION | MUTATION | QUERY | SUBSCRIPTION
  enum UserRole {
    RECIPES_ADMIN
    RECIPES_EDITOR
    USER
    ADMIN
  }
`;

// Based on https://blog.apollographql.com/reusable-graphql-schema-directives-131fb3a177d1
class AuthDirective extends SchemaDirectiveVisitor {
  visitObject(type) {
    this.ensureFieldsWrapped(type);
    type._requiredAuthRole = this.args.requires;
    type._allowSelf = this.args.allowSelf;
  }

  visitFieldDefinition(field, details) {
    this.ensureFieldsWrapped(details.objectType);
    field._requiredAuthRole = this.args.requires;
    field._allowSelf = this.args.allowSelf;
  }

  ensureFieldsWrapped(objectType) {
    // Mark the GraphQLObjectType object to avoid re-wrapping:
    if (objectType._authFieldsWrapped) return;
    objectType._authFieldsWrapped = true;

    const fields = objectType.getFields();

    Object.keys(fields).forEach(fieldName => {
      const field = fields[fieldName];
      const { resolve = defaultFieldResolver } = field;

      field.resolve = async (root, args, context, info) => {
        const requiredRole = field._requiredAuthRole || objectType._requiredAuthRole;
        const allowSelf = field._allowSelf || objectType._allowSelf;

        const authError = new ApolloError("not authorized", "NOT_AUTHORIZED");
        if (!requiredRole) {
          return resolve.apply(this, [root, args, context, info]);
        }

        const { currentUser } = context;
        if (!currentUser) {
          throw authError;
        }

        const userRoles = currentUser.roles.map(r => r.toUpperCase()) || [];
        const hasRole = userRoles.includes(requiredRole);

        if (!hasRole && !allowSelf) {
          throw authError;
        }

        const value = await resolve.apply(this, [root, args, context, info]);
        let isSelf = false;
        if (info.returnType.name === "User" && value.id === currentUser.id) {
          isSelf = true;
        }
        if (info.parentType.name === "User" && root.id === currentUser.id) {
          isSelf = true;
        }
        if (!hasRole && !isSelf) {
          throw authError;
        }

        return value;
      };
    });
  }
}

export const authDirectives = {
  auth: AuthDirective,
};
