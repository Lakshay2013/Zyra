const {Queue}=require('bullmq')

const connection={
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6380,
}

let riskQueue = null

exports.getRiskQueue = () => {
  if(!riskQueue){
    riskQueue = new Queue('risk-analysis', { connection })
  }
  return riskQueue
}

exports.connection = connection
