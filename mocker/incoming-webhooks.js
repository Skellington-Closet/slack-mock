'use strict'

const incomingWebhooks = module.exports
const nock = require('nock')
const customResponses = require('../lib/custom-responses')
const utils = require('../lib/utils')

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
    incomingWebhooks.calls.push({
      url: url,
      body: utils.parseParams(path, requestBody),
      headers: this.req.headers
    })

    return customResponses.get('incoming-webhooks', url)
  }
}
