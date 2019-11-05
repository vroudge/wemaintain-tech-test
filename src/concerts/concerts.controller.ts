import * as fastify from "fastify";
import * as concertsModel from "./concerts.model";

export const getConcertsController = db => async (
  request: fastify.FastifyRequest,
  reply
) => {
  const {
    latitude,
    longitude,
    radius,
    "bandIds[]": bandIdsRaw = ""
  }: fastify.DefaultQuery = request.query;
  // format expected is ?bandIds[]=1,bandIds[]=2
  const bandIds = bandIdsRaw.split(",").filter(str => str.length);
  // check that these bandids are valid
  const bandIdsAreValid = bandIds.every(
    bandId => bandId.length && !isNaN(parseInt(bandId, 10))
  );

  const hasLocationArgs =
    typeof latitude === "number" &&
    typeof longitude === "number" &&
    typeof radius === "number";
  // if we have location arguments and valid bandids
  // or just location arguments
  if (hasLocationArgs && bandIdsAreValid) {
    // find venues using these arguments
    const res = await concertsModel.findAllByLocation(db, {
      bandIds,
      latitude,
      longitude,
      radius
    });
    reply.code(200).send(res);
  } else if (bandIds.length) {
    // find venues by bandIds
    const res = await concertsModel.findAllByBandsId(db, { bandIds });
    reply.send(res);
  }
};
