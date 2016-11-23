'use strict';

const web = module.exports
const nock = require('nock')
const qs = require('qs')
const logger = require('../lib/logger')
const rtm = require('./rtm')
let customResponses = {}

web.calls = []

web._ = {}

web._.init = function () {
  // Slack accepts both GET and POST requests
  nock('https://slack.com/api')
    .persist()
    .get(/.*/)
    .query(true)
    .reply(reply) // TODO test GET requests

    .post(/.*/, () => true)
    .reply(reply)
}

web.reset = function () {
  web.calls.splice(0, web.calls.length)
  customResponses = {}
}

web.addResponse = function (cfg) {
  if (!customResponses[cfg.action]) {
    customResponses[cfg.action] = []
  }

  customResponses[cfg.action].push({
    status: cfg.status || 200,
    body: cfg.body || {ok: true},
    headers: cfg.headers || {}
  })
}

function reply (uri, requestBody) {
  const action = uri.replace('/api/', '')
  const response = getResponse(action)

  if (typeof requestBody === 'string') {
    requestBody = qs.parse(requestBody)
  }

  web.calls.push({
    action: action,
    body: requestBody,
    headers: this.req.headers
  })

  return [
    response.status,
    response.body,
    response.headers
  ]
}

function getResponse(action) {
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