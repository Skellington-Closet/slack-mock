'use strict'

const webResponses = module.exports
const rtm = require('./rtm')
const logger = require('../lib/logger')
let userOverrides = {}

webResponses._ = {}

webResponses.addResponse = function (cfg) {
  if (!userOverrides[cfg.action]) {
    userOverrides[cfg.action] = []
  }

  userOverrides[cfg.action].push({
    status: cfg.status || 200,
    body: cfg.body || {ok: true},
    header: cfg.header || {}
  })
}

webResponses._.getResponse = function (action) {
  let response = {status: 200, body: {ok: true}}

  if (userOverrides[action] && userOverrides[action].length) {
    response = userOverrides[action].shift()
    logger.debug('responding with override', response)
  }

  if (action === 'rtm.start' && response.body.ok) {
    response.body.url = rtm._.url
  }

  return response
}

webResponses._.reset = function () {
  userOverrides = {}
}

