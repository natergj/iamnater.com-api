const dist = require("./dist/index");
exports.handler = dist.graphqlHandler;

process.on('uncaughtException', (e) => console.error(e));
process.on('unhandledRejection', (reason) => {
  throw new Error(reason);
});
