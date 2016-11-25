'use strict'

const web = module.exports
const nock = require('nock')
const qs = require('qs')
const logger = require('../lib/logger')
const rtm = require('./rtm')
let customResponses = {}

web.calls = []

web._ = {}

web._.init = function () {
  // for OAuth
  nock('https://slack.com/oauth/authorize')
    .persist()
    .get(/.*/)
    .query(true)
    .reply(reply)

    .post(/.*/, () => true)
    .reply(replyOAuth)

  // Slack accepts both GET and POST requests
  nock('https://slack.com/api')
    .persist()
    .get(/.*/)
    .query(true)
    .reply(reply)

    .post(/.*/, () => true)
    .reply(replyApi)
}

web.reset = function () {
  web.calls.splice(0, web.calls.length)
  customResponses = {}
}

web.addResponse = function (cfg) {
  if (!customResponses[cfg.url]) {
    customResponses[cfg.url] = []
  }

  customResponses[cfg.url].push({
    statusCode: cfg.statusCode || 200,
    body: cfg.body || {ok: true},
    headers: cfg.headers || {}
  })
}

function replyOAuth(uri, requestBody) {
  return reply('https://slack.com/oauth/authorize', requestBody)
}

function replyApi(uri, requestBody) {
  return reply(`https://slack.com${uri}`, requestBody)
}


function reply (uri, requestBody) {
  const response = getResponse(action)

  if (typeof requestBody === 'string') {
    requestBody = qs.parse(requestBody)
  }

  web.calls.push({
    url: uri,
    body: requestBody,
    headers: this.req.headers
  })

  return [
    response.statusCode,
    response.body,
    response.headers
  ]
}

function getResponse (action) {
  let response = {statusCode: 200, body: {ok: true}}

  if (customResponses[action] && customResponses[action].length) {
    response = customResponses[action].shift()
    logger.debug('responding to web api with override', response)
  }

  if (action === 'rtm.start' && response.body.ok) {
    response.body.url = rtm._.url
  }

  return response
}
