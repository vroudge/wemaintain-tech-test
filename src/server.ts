import * as fastify from "fastify";
import { IncomingMessage, Server, ServerResponse } from "http";

import * as concerts from "./concerts";
import { config } from "./config";
import { dbConnector } from "./dbConnector";

const DEFAULT_PORT: string | undefined = "8080";
const port: number = parseInt(process.env.NODE_PORT || DEFAULT_PORT, 10);

export const buildFastify: () => fastify.FastifyInstance = (): fastify.FastifyInstance => {
  const app: fastify.FastifyInstance = fastify({ logger: !!process.env.DEBUG });
  // Register db connector as a plugin to be able to get db connection in context of router
  app.register(dbConnector, {
    ...config,
    pluginTimeout: 20000
  });
  // Register the routes
  app.register(concerts.routes);

  return app;
};

if (process.env.NODE_ENV !== "test") {
  (async (): Promise<void> => {
    const app: fastify.FastifyInstance = buildFastify();
    // tslint:disable-next-line:no-magic-numbers
    await app.listen(port || 8080);
    // tslint:disable-next-line:no-console
    console.log(`listening on ${port}`);
  })();
}
