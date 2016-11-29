'use strict'

const incomingWebhooks = module.exports
const nock = require('nock')
const qs = require('qs')
const customResponses = require('../lib/custom-responses')

incomingWebhooks.calls = []

incomingWebhooks.reset = function () {
  customResponses.reset('incoming-webhooks')
  incomingWebhooks.calls.splice(0, incomingWebhooks.calls.length)
}

incomingWebhooks.addResponse = function (opts) {
  customResponses.set('incoming-webhooks', opts)
}

incomingWebhooks.register = function (url) {
  // TODO this _could_ cause problems if we register the same host twice
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

    return customResponses.get('incoming-webhooks', url)
  }
}
