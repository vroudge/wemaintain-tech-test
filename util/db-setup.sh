##initialize node
#curl  -u Administrator:password -X POST http://localhost:8091/nodes/self/controller/settings \
#  -d 'path=%2Fopt%2Fcouchbase%2Fvar%2Flib%2Fcouchbase%2Fdata& \
#  index_path=%2Fopt%2Fcouchbase%2Fvar%2Flib%2Fcouchbase%2Fdata& \
#  cbas_path=%2Fmnt%2Fd1&cbas_path=%2Fmnt%2Fd2&cbas_path=%2Fmnt%2Fd3'

#set the indexation system options
curl -X POST 'http://localhost:8091/settings/indexes' -u DBAdmin:admin123 -d 'indexerThreads=0' \
-d 'logLevel=info' -d 'maxRollbackPoints=5' -d 'memorySnapshotInterval=200' \
-d 'stableSnapshotInterval=5000' -d 'storageMode=memory_optimized'

#initialize all services
curl -XPOST http://localhost:8091/node/controller/setupServices -u DBAdmin:admin123 -d 'services=kv,n1ql,index,fts'  --max-time 10 \
    --retry 5 \
    --retry-delay 0 \
    --retry-max-time 40

#create a bucket
curl -XPOST http://localhost:8091/pools/default/buckets -u DBAdmin:admin123 \
  -d name=default \
  -d flushEnabled=1 \
  -d 'ramQuotaMB=100' \
  -d 'bucketType=membase' \
  -d 'authType=none'

#initalize the cluster ids
curl -XPOST http://localhost:8091/settings/web -d port=8091 -d username=DBAdmin -d password=admin123  --max-time 10 \
    --retry 5 \
    --retry-delay 0 \
    --retry-max-time 40
