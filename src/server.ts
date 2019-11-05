import * as fastify from "fastify";
import { IncomingMessage, Server, ServerResponse } from "http";

import * as concerts from "./concerts";
import config from "./config";
import { dbConnector } from "./db-connector";

const DEFAULT_PORT: string = "8080";
const port: number = parseInt(process.env.NODE_PORT || DEFAULT_PORT, 10);

export const buildFastify = () => {
  const app: fastify.FastifyInstance<
    Server,
    IncomingMessage,
    ServerResponse
  > = fastify({ logger: !!process.env.DEBUG });
  // register db connector as a plugin to be able to get db connection in context of router
  app.register(dbConnector, {
    ...config,
    pluginTimeout: 20000
  });
  // register the routes
  app.register(concerts.routes);
  return app;
};

if (process.env.NODE_ENV !== "test") {
  (async () => {
    const app = buildFastify()
    await app.listen(port || 8080);
    // tslint:disable-next-line:no-console
    console.log(`listening on ${port}`);
  })();
}
