'use strict'

const rtm = require('./mocker/rtm')
const web = require('./mocker/web')
const incomingWebhooks = require('./mocker/incoming-webhooks')
const outgoingWebhooks = require('./mocker/outgoing-webhooks')
const logger = require('./lib/logger')
let instance

module.exports = function (config) {
  if (instance) {
    return instance
  }

  if (config.logLevel) {
    logger.level = config.logLevel
  }

  rtm._.init({rtmPort: config.rtmPort})
  web._.init()

  logger.info('slack-mock running')

  instance = {
    web: {
      reset: web.reset.bind(web),
      addResponse: web.addResponse.bind(web),
      calls: web.calls
    },
    rtm: {
      send: rtm.send.bind(rtm),
      reset: rtm.reset.bind(rtm),
      calls: rtm.calls,
      connected: rtm.connected
    },
    incomingWebhooks: {
      register: incomingWebhooks.register.bind(incomingWebhooks),
      addResponse: incomingWebhooks.addResponse.bind(incomingWebhooks),
      reset: incomingWebhooks.reset.bind(incomingWebhooks),
      calls: incomingWebhooks.calls
    },
    outgoingWebhooks: {
      send: outgoingWebhooks.send.bind(outgoingWebhooks),
      reset: outgoingWebhooks.reset.bind(outgoingWebhooks),
      calls: outgoingWebhooks.calls
    },
    reset: function () {
      web.reset()
      rtm.reset()
      incomingWebhooks.reset()
      outgoingWebhooks.reset()
    }
  }

  return instance
}
