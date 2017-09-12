'use strict'

const web = module.exports
const nock = require('nock')
const customResponses = require('../lib/custom-responses')
const utils = require('../lib/utils')
const logger = require('../lib/logger')
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
  logger.debug(`resetting web`)
  web.calls.splice(0, web.calls.length)
  customResponses.reset('web')
}

web.addResponse = function (opts) {
  customResponses.set('web', opts)
}

function reply (path, requestBody) {
  const url = `https://slack.com${path.split('?')[0]}`
  const params = utils.parseParams(path, requestBody)

  logger.debug(`intercepted web request: ${url}`)

  web.calls.push({
    url: url,
    params: params,
    headers: this.req.headers
  })

  const response = customResponses.get('web', url)
  const responseBody = response[1]

  if (/rtm\.[start|connect]/.test(url) && responseBody.ok) {
    logger.debug('overriding specified url for rtm')

    const rtmUrl = rtm._.addToken(params.token)
    responseBody.url = rtmUrl
  }

  return response
}
