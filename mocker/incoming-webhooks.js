'use strict'

const incomingWebhooks = module.exports
const nock = require('nock')
const customResponses = require('../lib/custom-responses')
const utils = require('../lib/utils')

// Slack accepts both GET and POST requests, will intercept API and OAuth calls
nock('https://hooks.slack.com')
  .persist()
  .post(/.*/, () => true)
  .reply(reply)

incomingWebhooks.calls = []

incomingWebhooks.reset = function () {
  customResponses.reset('incoming-webhooks')
  incomingWebhooks.calls.splice(0, incomingWebhooks.calls.length)
}

incomingWebhooks.addResponse = function (opts) {
  customResponses.set('incoming-webhooks', opts)
}

function reply (path, requestBody) {
  const url = `https://hooks.slack.com${path}`

  incomingWebhooks.calls.push({
    url: url,
    params: utils.parseParams(path, requestBody),
    headers: this.req.headers
  })

  return customResponses.get('incoming-webhooks', url)
}
