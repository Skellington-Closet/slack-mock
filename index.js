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

  if (config.logLevel) {
    logger.level = config.logLevel
  }

  rtm._.init({rtmPort: config.rtmPort || 9001})
  web._.init()

  logger.info('slack-mock running')

  module.exports.instance = {
    events: {
      send: events.send.bind(events),
      reset: events.reset.bind(events),
      calls: events.calls
    },
    incomingWebhooks: {
      register: incomingWebhooks.register.bind(incomingWebhooks),
      addResponse: incomingWebhooks.addResponse.bind(incomingWebhooks),
      reset: incomingWebhooks.reset.bind(incomingWebhooks),
      calls: incomingWebhooks.calls
    },
    interactiveButtons: {
      send: interactiveButtons.send.bind(interactiveButtons),
      reset: interactiveButtons.reset.bind(interactiveButtons),
      calls: interactiveButtons.calls
    },
    outgoingWebhooks: {
      send: outgoingWebhooks.send.bind(outgoingWebhooks),
      reset: outgoingWebhooks.reset.bind(outgoingWebhooks),
      calls: outgoingWebhooks.calls
    },
    rtm: {
      send: rtm.send.bind(rtm),
      reset: rtm.reset.bind(rtm),
      calls: rtm.calls,
      clients: rtm.clients
    },
    slashCommands: {
      send: slashCommands.send.bind(slashCommands),
      reset: slashCommands.reset.bind(slashCommands),
      calls: slashCommands.calls
    },
    web: {
      reset: web.reset.bind(web),
      addResponse: web.addResponse.bind(web),
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
