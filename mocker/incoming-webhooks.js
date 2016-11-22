'use strict'

const incomingWebhooks = module.exports
const nock = require('nock')
const qs = require('qs')
const logger = require('../lib/logger')
const customResponses = {}

incomingWebhooks.calls = []

incomingWebhooks.reset = function () {
  incomingWebhooks.calls.splice(0, incomingWebhooks.calls.length)
}

incomingWebhooks.addResponse = function (cfg) {
  if (!customResponses[cfg.url]) {
    customResponses[cfg.url] = []
  }

  customResponses[cfg.url].push({
    status: cfg.status || 200,
    body: cfg.body || {ok: true},
    headers: cfg.headers || {}
  })
}

incomingWebhooks.register = function (url) {
  nock(url)
    .persist()
    .post(/.*/, () => true)
    .reply(reply)
}

function reply (url, requestBody) {
  const headers = this.req.headers

  if (headers['content-type'] === 'application/x-www-form-urlencoded') {
    requestBody = qs.parse(requestBody) // TODO will this automatically url decode the payload?
  }

  incomingWebhooks.calls.push({
    url: url,
    body: requestBody,
    headers: headers
  })

  return getResponse(url)
}

function getResponse (url) {
  let response = {status: 200, body: {ok: true}, headers: {}}

  if (customResponses[url] && customResponses[url].length) {
    response = customResponses[url].shift()
    logger.debug('responding to incoming webhook with override', response)
  }

  return [
    response.status,
    response.body,
    response.headers
  ]
}
