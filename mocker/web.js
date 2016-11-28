'use strict'

const web = module.exports
const nock = require('nock')
const qs = require('qs')
const customResponses = require('../lib/custom-responses')
const rtm = require('./rtm')

web.calls = []

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

web.reset = function () {
  web.calls.splice(0, web.calls.length)
  customResponses.reset('web')
}

web.addResponse = function (cfg) {
  customResponses.set('web', cfg)
}

function replyOAuth (path, requestBody) {
  return reply('https://slack.com/oauth/authorize', requestBody, this.req)
}

function replyApi (path, requestBody) {
  return reply(`https://slack.com${path}`, requestBody, this.req)
}

function reply (url, requestBody, req) {
  if (typeof requestBody === 'string') {
    requestBody = qs.parse(requestBody)
  }

  web.calls.push({
    url: url,
    body: requestBody,
    headers: req.headers
  })

  const response = customResponses.get('web', url)
  const body = response[1]
  if (/rtm\.start$/.test(url) && body.ok) {
    body.url = rtm._.url
  }

  return response
}
