'use strict'

const rtm = module.exports
const WebSocketServer = require('ws').Server
const logger = require('../lib/logger')
let ws

rtm.calls = []

rtm._ = {} // for internal state that won't be exposed

rtm._.init = function (config) {
  rtm._.url = `ws://localhost:${config.rtmPort}`
  const wss = new WebSocketServer({ port: config.rtmPort })

  logger.info(`starting RTM server on port ${config.rtmPort}`)

  wss.on('connection', (websock) => {
    ws = websock

    ws.on('message', (message) => {
      logger.debug('message received')
      logger.debug(message)

      try {
        rtm.calls.push(JSON.parse(message))
      } catch (err) {
        logger.error('could not parse incoming RTM message')
        logger.error(err)

        rtm.calls.push(message)
      }
    })

    logger.info(`RTM connected on port ${config.rtmPort}`)
  })
}

rtm.reset = function () {
  // in place reset
  rtm.calls.splice(0, rtm.calls.length)
}

rtm.send = function (message, msDelay) {
  ws.send(JSON.stringify(message))
  return delay(msDelay || 100)
}

function delay (ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}
