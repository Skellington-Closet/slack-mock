'use strict'

const web = module.exports
const nock = require('nock')
const customResponses = require('../lib/custom-responses')
const utils = require('../lib/utils')
const rtm = require('./rtm')

web.calls = []

// Slack accepts both GET and POST requests, will intercept API and OAuth calls
nock('https://slack.com')
  .persist()
  .get(/.*/)
  .query(true)
  .reply(reply)

  .post(/.*/, () => true)
  .reply(reply)

web.reset = function () {
  web.calls.splice(0, web.calls.length)
  customResponses.reset('web')
}

web.addResponse = function (opts) {
  customResponses.set('web', opts)
}

function reply (path, requestBody) {
  const url = `https://slack.com${path.split('?')[0]}`

  web.calls.push({
    url: url,
    body: utils.parseParams(path, requestBody),
    headers: this.req.headers
  })

  const response = customResponses.get('web', url)
  const body = response[1]
  if (/rtm\.start/.test(url) && body.ok) {
    body.url = rtm._.url
  }

  return response
}
