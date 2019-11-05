import {
  BoundingBox,
  createLocation,
  degToRad,
  getBoundingBox,
  getLatitude,
  getLongitude,
  LatLon,
  Location,
  normalizeLocation
} from "geolocation-utils";
import {Db} from "../dbConnector";

export const findAllByLocation = async (
  db: Db,
  { latitude, longitude, radius, bandIds = [] }
): Promise<object | Error> => {
  const location: Location = createLocation(latitude, longitude, "LatLon");

  // get bounding box corners North West and South East
  const { topLeft, bottomRight }: BoundingBox = getBoundingBox(
    [location],
    1000
  );

  // get all latitudes and longitudes from bounding box separately
  const topLeftLon: number = (getLongitude(topLeft) as unknown) as number;
  const topLeftLat: number = (getLatitude(topLeft) as unknown) as number;
  const bottomRightLon: number = (getLongitude(
    bottomRight
  ) as unknown) as number;
  const bottomRightLat: number = (getLatitude(
    bottomRight
  ) as unknown) as number;

  // get all corners of bounding box
  const minLat: number = degToRad(Math.min(topLeftLat, bottomRightLat));
  const maxLat: number = degToRad(Math.max(topLeftLat, bottomRightLat));
  const minLon: number = degToRad(Math.min(topLeftLon, bottomRightLon));
  const maxLon: number = degToRad(Math.max(topLeftLon, bottomRightLon));

  // normalize location checked in degrees
  const {
    lat: normalizedLocationLat,
    lon: normalizedLocationLng
  }: LatLon = normalizeLocation(location);

  // are we crossing the meridian
  const meridianCrossed: string = bottomRightLon > topLeftLon ? "OR" : "AND";

  // we're working with a sphere here ;) we need to have the earth radius to do the calculation correctly
  const EARTH_RADIUS_IN_KM: number = 6378137 / 1000;

  // adding filter function in the end if we want to also filter by bandId
  const bandIdsArray: string[] = bandIds.map(bandId => `band::${bandId}`);
  const bandIdQueryFragment: string =
    bandIdsArray.length > 0
      ? ` WHERE band.id IN ${JSON.stringify(bandIdsArray)}`
      : "";

  /*
   * this is where the fun happens
   * First we select the latitude, longitude and name of venues inside the bounding box we've calculated up here
   * Second, we draw a circle filling that bounding box and check whether the venue is inside this circle only selecting if it is inside the radius
   * Third we join that result with Concerts, order it by concert date
   * Finally we join it on Bands and if any parameter was added to filter by bandId, we take only those bandIds
   * */
  const query: string = `
    SELECT
      band.name as band,
      concertVenue.venue.name as location,
      concertVenue.concert.date,
      concertVenue.venue.latitude,
      concertVenue.venue.longitude
    FROM (
      SELECT * FROM (
        SELECT id, latitude, longitude, name FROM \`default\` as venue
        WHERE
          (RADIANS(latitude) >= $1 AND RADIANS(latitude) <= $2)
          AND (RADIANS(longitude) >= $3 AND RADIANS(longitude) <= $4)
          ${meridianCrossed} acos(sin( RADIANS($5)) * sin (RADIANS(latitude)) + cos( RADIANS($5))
          * cos(RADIANS(latitude)) * cos (RADIANS(longitude) - RADIANS($6))) <= $7
        ) as venue
      JOIN \`default\` concert ON venue.id=concert.venueId
      ORDER BY concert.date DESC
      ) as concertVenue
    JOIN \`default\` band ON META(band).id=concertVenue.concert.bandId
    ${bandIdQueryFragment}
  `;

  // execute the query with its parameters
  try {
    return db.query(query, [
      minLat,
      maxLat,
      minLon,
      maxLon,
      normalizedLocationLat,
      normalizedLocationLng,
      radius / EARTH_RADIUS_IN_KM
    ]);
  } catch (e) {
    throw new Error("QUERY_FAILED");
  }
};

export const findAllByBandsId = async (db, { bandIds }) => {
  const bandIdsArray: string[] = bandIds.map(bandId => `band::${bandId}`);
  const query: string = `
    SELECT 
      band.name as band, 
      venue.latitude, 
      venue.longitude, 
      venue.name as location,
      concert.date
    FROM \`default\` as band USE KEYS ${JSON.stringify(bandIdsArray)}
    JOIN \`default\` concert ON concert.bandId=META(band).id
    JOIN \`default\` venue ON concert.venueId=META(venue).id
    ORDER BY concert.date DESC
  `;
  try {
    return await db.query(query)
  } catch (e) {
    throw new Error("QUERY_FAILED");
  }
};
