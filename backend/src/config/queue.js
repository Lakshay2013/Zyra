const { Queue } = require('bullmq')

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6380,
}

// Namespace the BullMQ keyspace so a test run never shares a queue with a
// running dev/prod worker on the same Redis.
const prefix = process.env.BULLMQ_PREFIX || 'zyra'

let riskQueue = null
let logQueue = null

exports.getRiskQueue = () => {
  if (!riskQueue) riskQueue = new Queue('risk-analysis', { connection, prefix })
  return riskQueue
}

exports.getLogQueue = () => {
  if (!logQueue) logQueue = new Queue('interaction-logs', { connection, prefix })
  return logQueue
}

exports.connection = connection
exports.prefix = prefix
