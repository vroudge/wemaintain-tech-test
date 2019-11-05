export interface IDbConfig {
  /**
   * The bucket to whwich we're connecting on couchbase
   */
  bucketName: string;
  /**
   * The URL at which the cluster is located
   */
  clusterLocation: string;
  /**
   * The admin login for the couchbase cluster
   */
  login: string;
  /**
   * The password for the couchbase cluster
   */
  password: string;
}

interface IConfig extends IDbConfig{
  /**
   * The fastify plugin timeout
   */
  pluginTimeout: string | number;
}

/**
 * Configuration object
 */
export const config: IConfig = {
  bucketName: process.env.BUCKET_NAME || "default",
  // The location of the couchbase cluster
  clusterLocation: process.env.CLUSTER_LOCATION || "127.0.0.1:8091",
  // Login to the db
  login: process.env.DB_LOGIN || "DBAdmin",
  // Password to the db
  password: process.env.DB_PASSWORD || "admin123",
  // Fastify register acceptable timeout
  // Since couchbase takes a while to connect
  // We need to override the default 5000ms or fastify crashes
  // tslint:disable-next-line:no-magic-numbers
  pluginTimeout: process.env.PLUGIN_TIMEOUT || 20000
};
