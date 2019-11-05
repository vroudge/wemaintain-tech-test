/**
 * Configuration object
 */
export default {
  // the bucket to whwich we're connecting on couchbase
  bucketName: process.env.BUCKET_NAME || "default",
  // the location of the couchbase cluster
  clusterLocation: process.env.CLUSTER_LOCATION || "127.0.0.1:8091",
  // login to the db
  login: process.env.DB_LOGIN || "DBAdmin",
  // password to the db
  password: process.env.DB_PASSWORD || "admin123",
  // fastify register acceptable timeout
  // since couchbase takes a while to connect
  // we need to override the default 5000ms or fastify crashes
  pluginTimeout: process.env.PLUGIN_TIMEOUT || 20000
}