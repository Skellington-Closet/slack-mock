'use strict'

const rtm = module.exports
const WebSocketServer = require('ws').Server
const logger = require('../lib/logger')
const clients = []
let wss

rtm.calls = []

rtm._ = {} // for internal state that won't be exposed

rtm._.init = function (config) {
  rtm._.url = `ws://localhost:${config.rtmPort}`
  rtm._.connected = new Promise((resolve) => {
    setUpWebsocketServer(config.rtmPort, resolve)
  })
}

rtm.reset = function () {
  // in place reset
  rtm.calls.splice(0, rtm.calls.length)
  clients.forEach((client) => client.close())
  clients.splice(0, clients.length)
}

rtm.send = function (message, msDelay) {
  return rtm._.connected
    .then(() => {
      wss.clients.forEach((client) => {
        try {
          client.send(JSON.stringify(message))
        } finally {}
      })
    })
    .then(() => delay(msDelay || 100))
}

function delay (ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

function setUpWebsocketServer (port, connectedCallback) {
  wss = new WebSocketServer({ port: port })

  logger.info(`starting RTM server on port ${port}`)

  wss.on('connection', (client) => {
    clients.push(client)

    client.on('message', recordMessage)

    logger.info(`RTM connected on port ${port}`)
    connectedCallback()
  })
}

function recordMessage (message) {
  logger.debug('message received')
  logger.debug(message)

  try {
    rtm.calls.push(JSON.parse(message))
  } catch (err) {
    logger.error('could not parse incoming RTM message')
    logger.error(err)

    rtm.calls.push(message)
  }
}
