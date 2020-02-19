import { DynamoDB } from "aws-sdk";
import { Context, APIGatewayProxyEvent } from "aws-lambda";
import openIdClient from "./openIdClient";

const dynamoDbConfig: any = {
  region: "us-east-2",
};
if (process.env.RUNTIME_ENV === "production") {
  dynamoDbConfig.accessKeyId = process.env.DYNAMO_DB_API_KEY;
  dynamoDbConfig.secretAccessKey = process.env.DYNAMO_DB_API_SECRET;
}
if (process.env.RUNTIME_ENV === "local") {
  dynamoDbConfig.endpoint = process.env.DYNAMO_DB_ENDPOINT;
}

const db = new DynamoDB(dynamoDbConfig);

export default async ({ event, context }: { event: APIGatewayProxyEvent; context: Context }) => {
  const ctx: any = {
    headers: event.headers,
    db,
    apiGatewayEvent: event,
    apiGatewayContext: context,
  };

  const authHeader = event.headers.authorization || event.headers.Authorization;
  if (authHeader) {
    const [type, token] = authHeader.split(" ");
    if (type.toLowerCase() === "bearer") {
      const currentUser = await openIdClient.getTokenClaims(token);
      const userId = `${currentUser.iss}_${currentUser.sub}`;
      let user: any = await db.getItem({ TableName: "Users", Key: { Id: { S: userId }}}).promise();
      if (!user.Item || !user.Item.Id) {
        user = { Item: {
          Id: { S: userId },
          Email: { S: currentUser.email },
          Name: { S: currentUser.name },
        }};
        await db.putItem({ TableName: "Users", ...user }).promise();
      }
      const userData = DynamoDB.Converter.unmarshall(user.Item);
      console.log("db user", userData);
      if (!userData.Roles) {
        userData.Roles = [];
      } else {
        userData.Roles = userData.Roles.values;
      }
      ctx.currentUser = userData;
    }
  }
  return ctx;
};
