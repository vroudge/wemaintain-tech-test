import * as couchbase from "couchbase";
import * as fastify from "fastify";
// tslint:disable-next-line:no-require-imports
import fastifyPlugin = require("fastify-plugin");
import * as http from "http";

import { IDbConfig } from "./config";

/**
 * An object representing the connection to the Couchbase cluster
 */
export class Db {
  /**
   * The bucket instance
   */
  public bucket: typeof couchbase.Bucket = undefined;
  /**
   * The name of the bucket
   */
  private readonly bucketName: string;
  /**
   * The couchbase library cluster object
   */
  private cluster: typeof couchbase.Cluster;

  /**
   * The URI at which the cluster is located
   */
  private readonly clusterLocation: string;
  /**
   * The admin login
   */
  private readonly login: string;
  /**
   * The admin password
   */
  private readonly password: string;

  public constructor({
    clusterLocation,
    login,
    password,
    bucketName
  }: IDbConfig) {
    this.clusterLocation = clusterLocation;
    this.login = login;
    this.password = password;
    this.bucketName = bucketName;
  }

  /**
   * Creates indexes on all relevant fields
   */
  public createAllIndexes = async (): Promise<void> => {
    // This will fail only if indexes already exist
    // And we don't really care about it
    try {
      const indexesToCreate: string[] = [
        `CREATE INDEX \`concert_venueId_idx\` ON \`default\`(\`venueId\`) USING GSI`,
        `CREATE INDEX \`concert_bandId_idx\` ON \`default\`(\`bandId\`) USING GSI`,
        `CREATE INDEX \`venue_latlon_name_idx\` ON \`default\`(radians(\`latitude\`),radians(\`longitude\`),\`name\`,\`id\`) USING GSI`
      ];

      for (const index of indexesToCreate) {
        await this.query(index, []);
      }
    } catch (e) {
      // Therefore, only throw when the error is not related to indexes already existing
      // tslint:disable-next-line:typedef
      const INDEX_ALREADY_EXISTS_ERRCODE = 4300;
      if (e.code !== INDEX_ALREADY_EXISTS_ERRCODE) {
        throw e;
      }
    }
  };

  /**
   * Creates the primary index for the bucket
   * @param ignoreIfExists don't fail if index already exists
   * @param name the name of the index
   */
  public createPrimaryIndex = async ({
    ignoreIfExists,
    name
  }: {
    /**
     * Ignore failure if the index already exists
     */
    ignoreIfExists: boolean;
    /**
     * The name of the primary index that will be created
     */
    name: string;
  }): Promise<void> =>
    new Promise<void>((resolve): void => {
      this.bucket
        .manager()
        .createPrimaryIndex({ ignoreIfExists, name }, (err: Error) => {
          if (err) {
            throw err;
          }

          return resolve();
        });
    });

  /**
   * Escapes a string to form a query
   * @param query The query string to escape
   */
  public escape = (query: string): string =>
    couchbase.N1qlQuery.fromString(query);

  /**
   * Initialize the pool of connections to the couchbase cluster
   */
  public initDbConnection = async (): Promise<Db | Error> => {
    if (!this.cluster) {
      this.cluster = new couchbase.Cluster(this.clusterLocation);
      this.cluster.authenticate(this.login, this.password);
    }

    return new Promise<Db | Error>((resolve, reject) => {
      this.bucket = this.cluster.openBucket(this.bucketName, (err: Error) => {
        if (err) {
          reject(err);
        }
      });
      this.bucket.on("connect", () => resolve(this));
      this.bucket.on("error", (err: Error) => {
        throw err;
      });
    });
  };

  /**
   * Execute a N1QL query on the couchbase cluster
   * @param query The query string
   * @param params The parameters inserted in the query ('$0' is replaced by params[0] and so on)
   * @param debug A flag to receive more info related to the query (sort of ANALYZE)
   */
  public query = async (
    query: string,
    params: object,
    debug?: object
  ): Promise<object | Error> =>
    new Promise<object | Error>((resolve, reject) => {
      const queryString: string = this.escape(query);
      this.bucket.query(
        queryString,
        params,
        (
          err: Error | PromiseLike<Error>,
          result: PromiseLike<Error>,
          debugData: object
        ) => {
          if (err) {
            return reject(err);
          }
          if (debug) {
            return { ...result, debugData };
          }

          return resolve(result);
        }
      );
    });

  /**
   * Update or insert a document at given key
   * @param key The key at which we're upserting
   * @param value The document itself
   * @param params Any other params that can be passed to couchbase
   */
  public upsertObject = async (
    key: string,
    value: object,
    params: object = {}
  ): Promise<object | Error> =>
    new Promise((resolve, reject) => {
      this.bucket.upsert(
        `${key}`,
        value,
        params,
        (err: Error | PromiseLike<object | Error>, res: object) => {
          if (err) {
            return reject(err);
          }

          return resolve(res);
        }
      );
    });
}

export const dbConnector = fastifyPlugin(
  async (fastifyCtx: fastify.FastifyInstance, options: object) => {
    const dbInstance: Db = new Db(options as IDbConfig);
    const dbConnection: Db | Error = await dbInstance.initDbConnection();
    fastifyCtx.decorate("couchbase", dbConnection);
  }
);
