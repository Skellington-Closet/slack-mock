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
  // in place reset
  rtm.calls.splice(0, rtm.calls.length)
  rtm.clients.forEach((client) => client.close())
  rtm.clients.splice(0, rtm.clients.length)
}

rtm.broadcast = function (message, cb) {
  cb = cb || function () {}

  return Promise.all(rtm.clients.map((client) => {
    return rtm.send(message, client)
  }))
    .then(cb)
}

rtm.send = function (message, client, cb) {
  cb = cb || function () {}

  return new Promise((resolve) => {
    try {
      client.send(JSON.stringify(message), (e) => {
        if (e) {
          logger.info(`could not broadcast rtm message to all clients`, e)
        }
        resolve()
      })
    } catch (e) {
      logger.info(`could not broadcast rtm message to all clients`, e)
      resolve()
    }
  })
  .then(delay(10))
  .then(cb)
}

function delay (ms) {
  return () => new Promise((resolve) => {
    setTimeout(resolve, ms)
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

    logger.info(`RTM connected on port ${port}`)
  })
}

function recordMessage (client, message) {
  logger.debug('message received')
  logger.debug(message)

  message._client = client

  try {
    rtm.calls.push(JSON.parse(message))
  } catch (err) {
    logger.error('could not parse incoming RTM message')
    logger.error(err)

    rtm.calls.push(message)
  }
}
