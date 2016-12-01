'use strict'

const rtm = module.exports
const WebSocketServer = require('ws').Server
const logger = require('../lib/logger')
let wss

rtm.clients = []
rtm.calls = []

rtm._ = {} // for internal state that won't be exposed

rtm._.init = function (config) {
  rtm._.url = `ws://localhost:${config.rtmPort}`
  setUpWebsocketServer(config.rtmPort)
}

rtm.reset = function () {
  logger.debug(`resetting rtm`)

  // in place reset
  rtm.calls.splice(0, rtm.calls.length)
  rtm.clients.forEach((client) => client.close())
  rtm.clients.splice(0, rtm.clients.length)
}

rtm.broadcast = function (message) {
  return Promise.all(rtm.clients.map((client) => {
    return rtm.send(message, client)
      .catch(() => {}) // don't fail
  }))
}

rtm.send = function (message, client) {
  return new Promise((resolve, reject) => {
    try {
      client.send(JSON.stringify(message), (e) => {
        if (e) {
          logger.error(`could not send rtm message to client`, e)
          return reject(e)
        }
      })
    } catch (e) {
      logger.error(`could not send rtm message to client`, e)
      return reject(e)
    }
    resolve()
  })
}

function setUpWebsocketServer (port) {
  wss = new WebSocketServer({ port: port })

  logger.info(`starting RTM server on port ${port}`)

  wss.on('connection', (client) => {
    rtm.clients.push(client)

    client.on('message', (message) => {
      recordMessage(client, message)
    })

    logger.info(`client connected to RTM API`)
  })
}

function recordMessage (client, message) {
  logger.debug('message received')
  logger.debug(message)

  let parsedMessage = null

  try {
    parsedMessage = JSON.parse(message)
  } catch (err) {
    logger.error('could not parse incoming RTM message')
    logger.error(err)
  }

  logger.debug(`intercepted RTM message`)

  rtm.calls.push({
    rawMessage: message,
    client: client,
    message: parsedMessage
  })
}
