const {Queue}=require('bullmq')

const connection={
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6380,
}

let riskQueue = null
let logQueue = null

exports.getRiskQueue = () => {
  if(!riskQueue){
    riskQueue = new Queue('risk-analysis', { connection })
  }
  return riskQueue
}

exports.getLogQueue = () => {
  if(!logQueue){
    logQueue = new Queue('interaction-logs', { connection })
  }
  return logQueue
}

exports.connection = connection
