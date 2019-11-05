import { createLocation, distanceTo } from "geolocation-utils";
import * as server from "../src/server";

const CONCERT_OBJECT_KEYS = [
  "band",
  "date",
  "latitude",
  "location",
  "longitude"
];
describe("Concerts", () => {
  describe("/concerts", () => {
    let fastify;
    beforeAll(async () => {
      fastify = server.buildFastify();
    });
    afterAll(async () => {
      fastify.couchbase.bucket.disconnect();
      fastify.close();
    });
    describe("With location parameters only", () => {
      describe("Given a geolocation with no venues", () => {
        let res;
        let json;

        beforeAll(async () => {
          const locationRaw = {
            latitude: 0,
            longitude: 0,
            radius: 0
          };

          res = await fastify.inject({
            method: "GET",
            url: "/concerts",
            query: locationRaw
          });
          json = res.json();
        });

        it("is a HTTP 200 result", () => {
          expect(res.statusCode).toBe(200);
        });

        it("returns an empty list", () => {
          expect(json).toStrictEqual([]);
        });
      });
      describe("Given a geolocation with a single venue", () => {
        let res;
        let json;
        let location;

        beforeAll(async () => {
          const locationRaw = {
            latitude: 52.5183113,
            longitude: 13.4717676,
            radius: 0
          }; // "0 kilometers around the coordinates of K17, Berlin, Germany"

          location = createLocation(
            locationRaw.latitude,
            locationRaw.longitude,
            "LatLon"
          );
          res = await fastify.inject({
            method: "GET",
            url: "/concerts",
            query: locationRaw
          });
          json = res.json();
        });

        it("is a HTTP 200 result", () => {
          expect(res.statusCode).toBe(200);
        });

        it("returns a list", () => {
          expect(Array.isArray(json)).toBeTruthy();
          expect(json.length).toBe(45);
        });

        it("returns only one location", () => {
          const locationNames = new Set();
          for (const obj of json) {
            // add the name of the location to a set to check how many different locations
            // were returned by the route
            locationNames.add(obj.location);
          }
          // we found a single location
          expect(locationNames.size).toBe(1);
          expect(Array.from(locationNames)).toStrictEqual([
            "K17, Berlin, Germany"
          ]);
        });

        it("returns the concerts in the provided radius of the provided location", async () => {
          for (const obj of json) {
            expect(Object.keys(obj)).toStrictEqual(CONCERT_OBJECT_KEYS);
            const locationTested = createLocation(
              obj.latitude,
              obj.longitude,
              "LatLon"
            );
            // it is an exact location so distance should be 0
            expect(distanceTo(location, locationTested)).toBe(0);
          }
        });
      });
      describe("Given a geolocation with multiple venues", () => {
        let res;
        let json;
        let location;

        beforeAll(async () => {
          const locationRaw = {
            latitude: 52.5183113,
            longitude: 13.4717676,
            radius: 2
          };
          location = createLocation(
            locationRaw.latitude,
            locationRaw.longitude,
            "LatLon"
          );
          res = await fastify.inject({
            method: "GET",
            url: "/concerts",
            query: locationRaw
          });
          json = res.json();
        });

        it("is a HTTP 200 result", () => {
          expect(res.statusCode).toBe(200);
        });

        it("returns a list", () => {
          expect(Array.isArray(json)).toBeTruthy();
          expect(json.length).toBe(152);
        });

        it("returns multiple locations", () => {
          const locationNames = new Set();
          for (const obj of json) {
            // add the name of the location to a set to check how many different locations
            // were returned by the route
            locationNames.add(obj.location);
          }
          // we found a single location
          expect(locationNames.size).toBe(3);
        });

        it("returns the concerts in the provided radius of the provided location", async () => {
          for (const obj of json) {
            expect(Object.keys(obj)).toStrictEqual(CONCERT_OBJECT_KEYS);
            const locationTested = createLocation(
              obj.latitude,
              obj.longitude,
              "LatLon"
            );
            // it is an exact location so distance should be 0
            expect(distanceTo(location, locationTested)).toBeLessThanOrEqual(
              2000
            );
          }
        });
      });
      describe("Given a geolocation with negative radius", () => {
        let res;
        let json;
        let location;

        beforeAll(async () => {
          const locationRaw = {
            latitude: 52.5183113,
            longitude: 13.4717676,
            radius: -1
          };
          location = createLocation(
            locationRaw.latitude,
            locationRaw.longitude,
            "LatLon"
          );
          res = await fastify.inject({
            method: "GET",
            url: "/concerts",
            query: locationRaw
          });
          json = res.json();
        });

        it("is a HTTP 400 error", () => {
          expect(res.statusCode).toBe(400);
          expect(json.statusCode).toBe(400);
          expect(json.error).toBe("Bad Request");
        });
      });
      describe("Given an incomplete geolocation", () => {
        let res;
        let json;

        beforeAll(async () => {
          const locationRaw = {
            longitude: 13.4717676,
            radius: 1
          };
          res = await fastify.inject({
            method: "GET",
            url: "/concerts",
            query: locationRaw
          });
        });

        it("is a HTTP 400 error", () => {
          expect(res.statusCode).toBe(400);
        });
      });
    });
  });
});
