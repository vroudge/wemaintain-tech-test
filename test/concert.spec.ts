import { createLocation, distanceTo } from "geolocation-utils";

import * as server from "../src/server";

const CONCERT_OBJECT_KEYS: string[] = [
  "band",
  "date",
  "latitude",
  "location",
  "longitude"
];
describe("Concerts", () => {
  describe("/concerts", () => {
    let fastify;
    beforeAll(() => {
      fastify = server.buildFastify();
    });
    afterAll(() => {
      fastify.couchbase.bucket.disconnect();
      fastify.close();
    });
    describe("With location query parameters only", () => {
      describe("Given a geolocation with no venues", () => {
        let res;
        let json;

        beforeAll(async () => {
          const queryParams = {
            latitude: 0,
            longitude: 0,
            radius: 0
          };

          res = await fastify.inject({
            method: "GET",
            url: "/concerts",
            query: queryParams
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
          const queryParams = {
            latitude: 52.5183113,
            longitude: 13.4717676,
            radius: 0
          }; // "0 kilometers around the coordinates of K17, Berlin, Germany"

          location = createLocation(
            queryParams.latitude,
            queryParams.longitude,
            "LatLon"
          );
          res = await fastify.inject({
            method: "GET",
            url: "/concerts",
            query: queryParams
          });
          json = res.json();
        });

        it("is a HTTP 200 result", () => {
          expect(res.statusCode).toBe(200);
        });

        it("returns a list of concerts", () => {
          expect(Array.isArray(json)).toBeTruthy();
          expect(json.length).toBe(45);
        });

        it("returns only one location", () => {
          const locationNames = new Set();
          for (const obj of json) {
            // Add the name of the location to a set to check how many different locations
            // Were returned by the route
            locationNames.add(obj.location);
          }
          // We found a single location
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
            // It is an exact location so distance should be 0
            expect(distanceTo(location, locationTested)).toBe(0);
          }
        });

        it("returns an ordered list by date descending", () => {
          const dates = json.map(elem => elem.date);
          const sortedDates = dates.sort((ts1, ts2) =>
            ts1 > ts2 ? -1 : ts1 < ts2 ? 1 : 0
          );
          expect(sortedDates).toStrictEqual(dates);
        });
      });
      describe("Given a geolocation with multiple venues", () => {
        let res;
        let json;
        let location;

        beforeAll(async () => {
          const queryParams = {
            latitude: 52.5183113,
            longitude: 13.4717676,
            radius: 2
          };
          location = createLocation(
            queryParams.latitude,
            queryParams.longitude,
            "LatLon"
          );
          res = await fastify.inject({
            method: "GET",
            url: "/concerts",
            query: queryParams
          });
          json = res.json();
        });

        it("is a HTTP 200 result", () => {
          expect(res.statusCode).toBe(200);
        });

        it("returns a list of concerts", () => {
          expect(Array.isArray(json)).toBeTruthy();
          expect(json.length).toBe(152);
        });

        it("returns multiple locations", () => {
          const locationNames = new Set();
          for (const obj of json) {
            // Add the name of the location to a set to check how many different locations
            // Were returned by the route
            locationNames.add(obj.location);
          }
          // We found a single location
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
            // It is an exact location so distance should be 0
            expect(distanceTo(location, locationTested)).toBeLessThanOrEqual(
              2000
            );
          }
        });

        it("returns an ordered list by date descending", () => {
          const dates = json.map(elem => elem.date);
          const sortedDates = dates.sort((ts1, ts2) =>
            ts1 > ts2 ? -1 : ts1 < ts2 ? 1 : 0
          );
          expect(sortedDates).toStrictEqual(dates);
        });
      });
      describe("Given a geolocation with negative radius", () => {
        let res;
        let json;
        let location;

        beforeAll(async () => {
          const queryParams = {
            latitude: 52.5183113,
            longitude: 13.4717676,
            radius: -1
          };
          location = createLocation(
            queryParams.latitude,
            queryParams.longitude,
            "LatLon"
          );
          res = await fastify.inject({
            method: "GET",
            url: "/concerts",
            query: queryParams
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

        beforeAll(async () => {
          const queryParams = {
            longitude: 13.4717676,
            radius: 1
          };
          res = await fastify.inject({
            method: "GET",
            url: "/concerts",
            query: queryParams
          });
        });

        it("is a HTTP 400 error", () => {
          expect(res.statusCode).toBe(400);
        });
      });
      describe("Given an invalid geolocation", () => {
        let res;

        beforeAll(async () => {
          const queryParams = {
            latitude: 'a',
            longitude: 13.4717676,
            radius: 1
          };
          res = await fastify.inject({
            method: "GET",
            url: "/concerts",
            query: queryParams
          });
        });

        it("is a HTTP 400 error", () => {
          expect(res.statusCode).toBe(400);
        });
      });
    });
    describe("With location parameters and bandId query parameter", () => {
      describe("Given a geolocation with no venues", () => {
        let res;
        let json;

        beforeAll(async () => {
          const queryParams = {
            latitude: 0,
            longitude: 0,
            radius: 0,
            "bandIds[]": [1]
          };

          res = await fastify.inject({
            method: "GET",
            url: "/concerts",
            query: queryParams
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
      describe("Given a geolocation with a single venue and a single bandId", () => {
        let res;
        let json;
        let location;

        beforeAll(async () => {
          const queryParams = {
            latitude: 52.5183113,
            longitude: 13.4717676,
            radius: 0,
            "bandIds[]": [223]
          }; // "0 kilometers around the coordinates of K17, Berlin, Germany"

          location = createLocation(
            queryParams.latitude,
            queryParams.longitude,
            "LatLon"
          );
          res = await fastify.inject({
            method: "GET",
            url: "/concerts",
            query: queryParams
          });
          json = res.json();
        });

        it("is a HTTP 200 result", () => {
          expect(res.statusCode).toBe(200);
        });

        it("returns a list of concerts", () => {
          expect(Array.isArray(json)).toBeTruthy();
          expect(json.length).toBe(1);
        });

        it("returns only one location and filters by band", () => {
          const locationNames = new Set();
          const bandNames = new Set();
          for (const obj of json) {
            // Add the name of the location to a set to check how many different locations
            // Were returned by the route
            locationNames.add(obj.location);
            bandNames.add(obj.band);
          }
          // We found a single location
          expect(locationNames.size).toBe(1);
          expect(Array.from(locationNames)).toStrictEqual([
            "K17, Berlin, Germany"
          ]);
          expect(Array.from(bandNames)).toStrictEqual(["City and Colour"]);
        });

        it("returns the concerts in the provided radius of the provided location", async () => {
          for (const obj of json) {
            expect(Object.keys(obj)).toStrictEqual(CONCERT_OBJECT_KEYS);
            const locationTested = createLocation(
              obj.latitude,
              obj.longitude,
              "LatLon"
            );
            // It is an exact location so distance should be 0
            expect(distanceTo(location, locationTested)).toBe(0);
          }
        });
      });
      describe("Given a geolocation with multiple venues and multiple bandIds", () => {
        let res;
        let json;
        let location;

        beforeAll(async () => {
          const queryParams = {
            latitude: 52.5183113,
            longitude: 13.4717676,
            radius: 2,
            "bandIds[]": "223,146"
          };
          location = createLocation(
            queryParams.latitude,
            queryParams.longitude,
            "LatLon"
          );
          res = await fastify.inject({
            method: "GET",
            url: "/concerts",
            query: queryParams
          });
          json = res.json();
        });

        it("is a HTTP 200 result", () => {
          expect(res.statusCode).toBe(200);
        });

        it("returns a list of concerts", () => {
          expect(Array.isArray(json)).toBeTruthy();
          expect(json.length).toBe(2);
        });

        it("returns multiple locations", () => {
          const locationNames = new Set();
          const bandNames = new Set();
          for (const obj of json) {
            // Add the name of the location to a set to check how many different locations
            // Were returned by the route
            locationNames.add(obj.location);
            bandNames.add(obj.band);
          }
          // We found 2 location with 2 bands
          expect(locationNames.size).toBe(2);
          expect(bandNames.size).toBe(2);
        });

        it("returns the concerts in the provided radius of the provided location", async () => {
          for (const obj of json) {
            expect(Object.keys(obj)).toStrictEqual(CONCERT_OBJECT_KEYS);
            const locationTested = createLocation(
              obj.latitude,
              obj.longitude,
              "LatLon"
            );
            // It is an exact location so distance should be 0
            expect(distanceTo(location, locationTested)).toBeLessThanOrEqual(
              2000
            );
          }
        });

        it("returns an ordered list by date descending", () => {
          const dates = json.map(elem => elem.date);
          const sortedDates = dates.sort((ts1, ts2) =>
            ts1 > ts2 ? -1 : ts1 < ts2 ? 1 : 0
          );
          expect(sortedDates).toStrictEqual(dates);
        });
      });
      describe("Given an incomplete geolocation and a single bandId", () => {
        let res;

        beforeAll(async () => {
          const queryParams = {
            longitude: 13.4717676,
            radius: 1,
            "bandIds[]": "223"
          };
          res = await fastify.inject({
            method: "GET",
            url: "/concerts",
            query: queryParams
          });
        });

        it("is a HTTP 400 error", () => {
          expect(res.statusCode).toBe(400);
        });
      });
      describe("Given an incomplete geolocation and an invalid bandId", () => {
        let res;

        beforeAll(async () => {
          const queryParams = {
            longitude: 13.4717676,
            radius: 1,
            "bandIds[]": "abcd"
          };
          res = await fastify.inject({
            method: "GET",
            url: "/concerts",
            query: queryParams
          });
        });

        it("is a HTTP 400 error", () => {
          expect(res.statusCode).toBe(400);
        });
      });
      describe("Given an incomplete geolocation and multiple invalid bandIds", () => {
        let res;

        beforeAll(async () => {
          const queryParams = {
            longitude: 13.4717676,
            radius: 1,
            "bandIds[]": "223,qwe224,225,abcd,"
          };
          res = await fastify.inject({
            method: "GET",
            url: "/concerts",
            query: queryParams
          });
        });

        it("is a HTTP 400 error", () => {
          expect(res.statusCode).toBe(400);
        });
      });
      describe("Given a geolocation with an existing venue and a non existing bandId", () => {
        let res;
        let json;
        let location;

        beforeAll(async () => {
          const queryParams = {
            latitude: 52.5183113,
            longitude: 13.4717676,
            radius: 0,
            "bandIds[]": [123123123]
          }; // "0 kilometers around the coordinates of K17, Berlin, Germany"

          location = createLocation(
            queryParams.latitude,
            queryParams.longitude,
            "LatLon"
          );
          res = await fastify.inject({
            method: "GET",
            url: "/concerts",
            query: queryParams
          });
          json = res.json();
        });

        it("is a HTTP 200 result", () => {
          expect(res.statusCode).toBe(200);
        });

        it("returns an empty list", () => {
          expect(Array.isArray(json)).toBeTruthy();
          expect(json.length).toBe(0);
        });
      });
    });
    describe("With bandId query parameter only", () => {
      describe("Given a single existing bandId", () => {
        let res;
        let json;

        beforeAll(async () => {
          const queryParams = {
            "bandIds[]": "1"
          };

          res = await fastify.inject({
            method: "GET",
            url: "/concerts",
            query: queryParams
          });
          json = res.json();
        });

        it("is a HTTP 200 result", () => {
          expect(res.statusCode).toBe(200);
        });

        it("returns an list of concerts", () => {
          expect(json).toHaveLength(5);
        });

        it("returns an ordered list by date descending", () => {
          const dates = json.map(elem => elem.date);
          const sortedDates = dates.sort((ts1, ts2) =>
            ts1 > ts2 ? -1 : ts1 < ts2 ? 1 : 0
          );
          expect(sortedDates).toStrictEqual(dates);
        });
      });
      describe("Given a single non-existing bandId", () => {
        let res;
        let json;

        beforeAll(async () => {
          const queryParams = {
            "bandIds[]": "1123123123"
          };

          res = await fastify.inject({
            method: "GET",
            url: "/concerts",
            query: queryParams
          });
          json = res.json();
        });

        it("is a HTTP 200 result", () => {
          expect(res.statusCode).toBe(200);
        });

        it("returns an empty list of concerts", () => {
          expect(json).toHaveLength(0);
        });
      });
      describe("Given multiple existing bandIds", () => {
        let res;
        let json;

        beforeAll(async () => {
          const queryParams = {
            "bandIds[]": "1,2,3"
          };

          res = await fastify.inject({
            method: "GET",
            url: "/concerts",
            query: queryParams
          });
          json = res.json();
        });

        it("is a HTTP 200 result", () => {
          expect(res.statusCode).toBe(200);
        });

        it("returns an list of concerts", () => {
          expect(json).toHaveLength(41);
        });

        it("returns an ordered list by date descending", () => {
          const dates = json.map(elem => elem.date);
          const sortedDates = dates.sort((ts1, ts2) =>
            ts1 > ts2 ? -1 : ts1 < ts2 ? 1 : 0
          );
          expect(sortedDates).toStrictEqual(dates);
        });
      });
    });
  });
});
