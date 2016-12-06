'use strict'

const rtm = require('./mocker/rtm')
const web = require('./mocker/web')
const incomingWebhooks = require('./mocker/incoming-webhooks')
const outgoingWebhooks = require('./mocker/outgoing-webhooks')
const slashCommands = require('./mocker/slash-commands')
const interactiveButtons = require('./mocker/interactive-buttons')
const events = require('./mocker/events')
const logger = require('./lib/logger')

module.exports.instance

module.exports = function (config) {
  if (module.exports.instance) {
    return module.exports.instance
  }

  config = config || {}

  if (config.logLevel) {
    logger.level = config.logLevel
  }

  rtm._.init({rtmPort: config.rtmPort || 9001})

  logger.info('slack-mock running')

  module.exports.instance = {
    events: {
      send: events.send,
      reset: events.reset,
      calls: events.calls
    },
    incomingWebhooks: {
      addResponse: incomingWebhooks.addResponse,
      reset: incomingWebhooks.reset,
      calls: incomingWebhooks.calls
    },
    interactiveButtons: {
      addResponse: interactiveButtons.addResponse,
      send: interactiveButtons.send,
      reset: interactiveButtons.reset,
      calls: interactiveButtons.calls
    },
    outgoingWebhooks: {
      send: outgoingWebhooks.send,
      reset: outgoingWebhooks.reset,
      calls: outgoingWebhooks.calls
    },
    rtm: {
      send: rtm.send,
      reset: rtm.reset,
      calls: rtm.calls,
      startServer: rtm.startServer,
      stopServer: rtm.stopServer
    },
    slashCommands: {
      addResponse: slashCommands.addResponse,
      send: slashCommands.send,
      reset: slashCommands.reset,
      calls: slashCommands.calls
    },
    web: {
      addResponse: web.addResponse,
      reset: web.reset,
      calls: web.calls
    },
    reset: function () {
      events.reset()
      incomingWebhooks.reset()
      interactiveButtons.reset()
      outgoingWebhooks.reset()
      rtm.reset()
      slashCommands.reset()
      web.reset()
    }
  }

  return module.exports.instance
}
