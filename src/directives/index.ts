import { typeDef as authTypeDef, authDirectives } from './auth';

export const directiveTypeDefs = [
  authTypeDef,
];

export const schemaDirectives = {
  ...authDirectives,
};