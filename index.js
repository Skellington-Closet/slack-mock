'use strict'

const rtm = require('./mocker/rtm')
const web = require('./mocker/web')
const responses = require('./mocker/web-responses')
const incomingWebhooks = require('./mocker/incoming-webhooks')
const logger = require('./lib/logger')
let instance

// TODO make sure everything is stateless
// use classes
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
      addResponse: responses.addResponse.bind(responses),
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
    reset: function () {
      web.reset()
      rtm.reset()
    }
  }

  return instance
}
