import * as couchbase from "couchbase";
import fastifyPlugin = require("fastify-plugin");

/**
 * The parameters that can be passed to the Db class
 * representing all the options for the connection
 */
export interface IDbOptions {
  clusterLocation: string;
  login: string;
  password: string;
  bucketName: string;
}

/**
 * An object representing the connection to the Couchbase cluster
 */
export class Db {
  public bucket = null;
  private cluster;

  private readonly clusterLocation: string;
  private readonly login: string;
  private readonly password: any;
  private readonly bucketName: any;

  constructor({ clusterLocation, login, password, bucketName }: IDbOptions) {
    this.clusterLocation = clusterLocation;
    this.login = login;
    this.password = password;
    this.bucketName = bucketName;
  }

  public escape = query => couchbase.N1qlQuery.fromString(query);

  /**
   * Execute a N1QL query on the couchbase cluster
   * @param query The query string
   * @param params The parameters inserted in the query ('$0' is replaced by params[0] and so on)
   * @param debug A flag to receive more info related to the query (sort of ANALYZE)
   */
  public query = async (query, params, debug?): Promise<any | Error> => {
    return new Promise((resolve, reject): any | Error => {
      const queryString = this.escape(query);
      this.bucket.query(queryString, params, (err, result, debugData) => {
        if (err) {
          return reject(err);
        }
        if (debug) {
          return { ...result, debugData };
        }
        return resolve(result);
      });
    });
  };

  /**
   * Initialize the pool of connections to the couchbase cluster
   */
  public initDbConnection = async (): Promise<Db | Error> => {
    if (!this.cluster) {
      this.cluster = new couchbase.Cluster(this.clusterLocation);
      this.cluster.authenticate(this.login, this.password);
    }

    return new Promise((resolve, reject) => {
      this.bucket = this.cluster.openBucket(this.bucketName, (err: Error) => {
        if (err) {
          reject(err);
        }
      });
      this.bucket.on("connect", () => {
        return resolve(this);
      });
      this.bucket.on("error", err => {
        throw err
      });
    });
  };

  /**
   * Update or insert a document at given key
   * @param key The key at which we're upserting
   * @param value The document itself
   * @param params Any other params that can be passed to couchbase
   */
  public upsertObject = async (
    key,
    value,
    params = {}
  ): Promise<object | Error> => {
    return new Promise((resolve, reject) => {
      this.bucket.upsert(`${key}`, value, params, (err, res) => {
        if (err) {
          return reject(err);
        }
        return resolve(res);
      });
    });
  };

  /**
   * Creates the primary index for the bucket
   * @param ignoreIfExists don't fail if index already exists
   * @param name the name of the index
   */
  public createPrimaryIndex = async ({ ignoreIfExists, name }) => {
    return new Promise(resolve => {
      this.bucket
        .manager()
        .createPrimaryIndex({ ignoreIfExists, name }, err => {
          if (err) {
            throw err;
          }
          return resolve();
        });
    });
  };

  /**
   * Creates indexes on all relevant fields
   */
  public createAllIndexes = async (): Promise<void> => {
    // this will fail only if indexes already exist
    // and we don't really care about it
    try {
      await Promise.all([
        this.query(
          `CREATE INDEX \`concert_venueId_idx\` ON \`default\`(\`venueId\`)`,
          []
        ),
        this.query(
          `CREATE INDEX \`concert_bandId_idx\` ON \`default\`(\`bandId\`)`,
          []
        ),
        this.query(
          `CREATE INDEX \`venue_latlon_name_idx\` ON \`default\`(radians(\`latitude\`),radians(\`longitude\`),\`name\`,\`id\`)`,
          []
        )
      ]);
    } catch (e) {
      // therefore, only throw when the error is not related to indexes already existing
      const INDEX_ALREADY_EXISTS_ERRCODE = 4300;
      if (e.code !== INDEX_ALREADY_EXISTS_ERRCODE) {
        throw e;
      }
    }
  };
}

export const dbConnector = fastifyPlugin(async (fastify, options) => {
  const dbInstance: Db = new Db(options);
  const dbConnection = await dbInstance.initDbConnection();
  fastify.decorate("couchbase", dbConnection);
});
