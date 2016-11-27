'use strict'

const incomingWebhooks = module.exports
const nock = require('nock')
const qs = require('qs')
const logger = require('../lib/logger')
let customResponses = new Map()

incomingWebhooks.calls = []

incomingWebhooks.reset = function () {
  customResponses.clear()
  incomingWebhooks.calls.splice(0, incomingWebhooks.calls.length)
}

incomingWebhooks.addResponse = function (opts) {
  if (!customResponses.get(opts.url)) {
    customResponses.set(opts.url, [])
  }

  customResponses.get(opts.url).push({
    statusCode: opts.statusCode || 200,
    body: opts.body || {ok: true},
    headers: opts.headers || {}
  })
}

incomingWebhooks.register = function (url) {
  nock(url)
    .persist()
    .post(/.*/, () => true)
    .reply(reply(url))
}

function reply (url) {
  return record

  function record (path, requestBody) {
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
}

function getResponse (url) {
  let response = {statusCode: 200, body: {ok: true}, headers: {}}
  const urlResponses = customResponses.get(url)

  if (urlResponses && urlResponses.length) {
    response = urlResponses.shift()
    logger.debug('responding to incoming webhook with override', response)
  }

  return [
    response.statusCode,
    response.body,
    response.headers
  ]
}
