import { gql } from "apollo-server-lambda";

export default gql`
  extend type Query {
    """
    Get details about currently logged in user
    """
    user: User
  }

  extend type Mutation {
    addUserRoles(userId: ID roles: [UserRole]): Boolean @auth(requires: ADMIN)
  }

  type User {
    id: ID!
    email: String
    name: String
    roles: [String]
  }
`;
