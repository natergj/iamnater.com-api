// Index file to be used to SAM local development

const dist = require("./dist/index");

exports.handler = dist.graphqlHandler;
