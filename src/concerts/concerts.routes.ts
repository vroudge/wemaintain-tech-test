import * as fastify from "fastify";
import * as concerts from "./index";

export const routes = async fast => {
  const db = fast.couchbase;
  fast.get("/concerts", getConcertsSchema, concerts.getConcertsController(db));
};

const getConcertsSchema: fastify.RouteShorthandOptions = {
  schema: {
    querystring: {
      properties: {
        bandIds: {
          items: {
            type: "number"
          },
          type: ["array"]
        },
        latitude: {
          type: ["number"],
          minimum: -90,
          maximum: 90
        },
        longitude: {
          type: ["number"],
          minimum: -180,
          maximum: 180,
        },
        radius: {
          type: ["number"],
          minimum: 0
        }
      },
      type: "object"
    },
    response: {
      200: {
        type: "array",
        items: {
          type: "object",
          properties: {
            band: { type: "string" },
            date: { type: "number" },
            latitude: { type: "number" },
            location: { type: "string" },
            longitude: { type: "number" }
          }
        }
      }
    }
  }
};
