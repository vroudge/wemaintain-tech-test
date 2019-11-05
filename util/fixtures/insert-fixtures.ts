/* tslint:disable */
import { readFile } from "fs";
import { promisify } from "util";
import { config } from "../../src/config";
import { Db } from "../../src/dbConnector";

const pReadFile = promisify(readFile);

const insertParams = [
  {
    filename: "data_bands.json",
    insertFunction: async (db, data) => {
      for (const object of data) {
        const id = `band::${object.id}`;
        try {
          await db.upsertObject(id, { ...object, id, kind: "band" });
        } catch (e) {
          // tslint:disable-next-line:no-console
          console.log(e);
        }
      }
    }
  },
  {
    filename: "data_venues.json",
    insertFunction: async (db, data) => {
      for (const object of data) {
        const id = `venue::${object.id}`;
        try {
          await db.upsertObject(id, { ...object, id, kind: "venue" });
        } catch (e) {
          // tslint:disable-next-line:no-console
          console.log(e);
        }
      }
    }
  },
  {
    filename: "data_concerts.json",
    insertFunction: async (db, data) => {
      for (const object of data) {
        const id = `concert::${object.bandId}::${object.venueId}`;
        try {
          await db.upsertObject(id, {
            ...object,
            bandId: `band::${object.bandId}`,
            id,
            kind: "concert",
            venueId: `venue::${object.venueId}`
          });
        } catch (e) {
          // tslint:disable-next-line:no-console
          console.log(e);
        }
      }
    }
  }
];

const insertFile = async (db, { filename, insertFunction }): Promise<void> => {
  const file: Buffer = await pReadFile(`${__dirname}/${filename}`);
  const json: object[] = JSON.parse(file.toString());
  await insertFunction(db, json);
};

const insertFixtures = async () => {
  try {
    const dbInstance = new Db({ ...config });
    await dbInstance.initDbConnection();
    await dbInstance.createPrimaryIndex({
      ignoreIfExists: true,
      name: "default_primary_idx"
    });
    await dbInstance.createAllIndexes();
    await Promise.all(
      insertParams.map(async elem => insertFile(dbInstance, elem))
    );
    process.exit(0);
  } catch (e) {
    // tslint:disable-next-line:no-console
    console.error(e);
    process.exit(1);
  }
};

// for programmatic vs CLI insert of fixtures
if (process.env.CLI) {
  (async () => {
    await insertFixtures();
  })();
}
