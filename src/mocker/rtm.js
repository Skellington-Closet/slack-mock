'use strict'

const rtm = module.exports
const WebSocketServer = require('ws').Server
const logger = require('../lib/logger')
const expressApp = require('express')()
const wssServers = new Map()
let baseUrl
let server

rtm.clients = []
rtm.calls = []

rtm._ = {} // for internal state that won't be exposed

rtm._.init = function (config) {
  const port = config.rtmPort

  server = expressApp.listen(port, () => {
    logger.info(`started RTM server on port ${port}`)
  })

  baseUrl = `ws://localhost:${port}/`
}

rtm._.addToken = function (token) {
  if (!wssServers.get(token)) {
    const wss = new WebSocketServer({
      server: server,
      path: `/${token}`,
      clientTracking: true
    })

    wssServers.set(token, wss)

    wss.on('connection', (client) => {
      client.on('message', recordMessage)

      logger.info(`client ${token} connected to RTM API`)
    })
  }

  return `${baseUrl}${token}`
}

rtm.reset = function () {
  logger.debug(`resetting rtm`)

  // in place reset
  rtm.calls.splice(0, rtm.calls.length)
}

rtm.send = function (token, message) {
  return new Promise((resolve, reject) => {
    const wss = wssServers.get(token)

    if (!wss) {
      return reject(new Error(`client with token ${token} has never connected to the RTM API`))
    }

    sendToClient(message, wss.clients[0]).then(resolve, reject)
  })
}

// sends the given message to the given client
function sendToClient (message, client) {
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

rtm.stopServer = function (token) {
  return new Promise((resolve, reject) => {
    const wss = wssServers.get(token)
    if (!wss) {
      return server.close(() => resolve())
    }

    wss.close((err) => {
      if (err) {
        logger.debug(`there was an error closing server ${token}`, err)
        return reject(err)
      }

      logger.debug(`server ${token} closed`)
      wssServers.delete(token)
      return server.close(() => resolve())
    })
  })
}

rtm.startServer = function (token) {
  rtm._.addToken(token)
}

function recordMessage (message) {
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
    token: parsedMessage ? parsedMessage.token : null,
    message: parsedMessage
  })
}
