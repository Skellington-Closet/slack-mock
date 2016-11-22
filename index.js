'use strict'

const rtm = require('./mocker/rtm')
const web = require('./mocker/web')
const responses = require('./mocker/web-responses')
const logger = require('./lib/logger')

module.exports = function (config) {
  if (config.logLevel) {
    logger.level = config.logLevel
  }

  rtm._.init({rtmPort: config.rtmPort})
  web._.init()

  logger.info('slack-mock running')

  return {
    web: {
      reset: web.reset.bind(web),
      addResponse: responses.addResponse.bind(responses),
      calls: web.calls
    },
    rtm: {
      send: rtm.send.bind(rtm),
      reset: rtm.reset.bind(rtm),
      calls: rtm.calls
    }
  }
}
