'use strict'

const incomingWebhooks = module.exports
const nock = require('nock')
const qs = require('qs')
const logger = require('../lib/logger')
let customResponses = {}

incomingWebhooks.calls = []

incomingWebhooks.reset = function () {
  customResponses = {}
  incomingWebhooks.calls.splice(0, incomingWebhooks.calls.length)
}

incomingWebhooks.addResponse = function (opts) {
  if (!customResponses[opts.url]) {
    customResponses[opts.url] = []
  }

  customResponses[opts.url].push({
    statusCode: opts.statusCode || 200,
    body: opts.body || {ok: true},
    headers: opts.headers || {}
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
    requestBody = qs.parse(requestBody)
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
    response.statusCode,
    response.body,
    response.headers
  ]
}
