'use strict'

const webResponses = module.exports
const rtm = require('./rtm')
const logger = require('../lib/logger')
let customResponses = {}

webResponses._ = {}

webResponses.addResponse = function (cfg) {
  if (!customResponses[cfg.action]) {
    customResponses[cfg.action] = []
  }

  customResponses[cfg.action].push({
    status: cfg.status || 200,
    body: cfg.body || {ok: true},
    headers: cfg.headers || {}
  })
}

webResponses._.getResponse = function (action) {
  let response = {status: 200, body: {ok: true}}

  if (customResponses[action] && customResponses[action].length) {
    response = customResponses[action].shift()
    logger.debug('responding to web api with override', response)
  }

  if (action === 'rtm.start' && response.body.ok) {
    response.body.url = rtm._.url
  }

  return response
}

webResponses._.reset = function () {
  customResponses = {}
}

