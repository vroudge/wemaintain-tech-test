import * as fastify from "fastify";
import * as concertsModel from "./concerts.model";

const badRequest = () => ({ statusCode: 400, message: "Bad Request" });

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

  // format expected is ?bandIds[]=1,2,3,4,5
  const bandIdsProvided: string[] = bandIdsRaw
    .split(",")
    .filter(str => str.length);
  // check that these bandids are valid integers
  const bandIdsAreValid: boolean = bandIdsProvided.every(
    bandId => bandId.length && !isNaN(parseInt(bandId, 10))
  );

  // if a single location argument has been passed, they must all be passed
  const checkLocationArguments = [latitude, longitude, radius].some(
    elem => elem !== undefined
  );
  // and if they are not valid we should throw immediately
  const locationArgumentsAreValid: boolean = !isNaN(latitude + longitude + radius);

  if (checkLocationArguments && !locationArgumentsAreValid) {
    reply.code(400).send(badRequest())
  }

  // if we have valid location arguments and valid bandids
  // or just location arguments
  if (locationArgumentsAreValid) {
    // find venues using location AND/OR bandIds
    const res = await concertsModel.findAllByLocation(db, {
      bandIds: bandIdsProvided,
      latitude,
      longitude,
      radius
    });
    reply.code(200).send(res);
  } else if (bandIdsAreValid) {
    // find venues by bandIds
    const res = await concertsModel.findAllByBandsId(db, {
      bandIds: bandIdsProvided
    });
    reply.code(200).send(res);
  }
  reply.code(400).send(badRequest);
};
