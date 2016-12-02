'use strict'

const interactiveButtons = module.exports
const request = require('request')
const nock = require('nock')
const logger = require('../lib/logger')
const utils = require('../lib/utils')
const customResponses = require('../lib/custom-responses')
let commandNumber = 0
const responseUrlBase = 'https://interactive-buttons.slack-mock'

nock(responseUrlBase)
  .persist()
  .post(/.*/, () => true)
  .reply(reply)

interactiveButtons.calls = []

interactiveButtons.send = function (target, data) {
  data.response_url = `${responseUrlBase}/${++commandNumber}`

  // interactive-buttons use content-type application/x-www-form-urlencoded
  request({
    uri: target,
    method: 'POST',
    form: data
  }, (err, res, body) => {
    if (err) {
      return logger.error(`error receiving response to interactive-buttons ${target}`, err)
    }

    if (typeof body === 'string') {
      try {
        body = JSON.parse(body) // TODO necessary?
      } catch (e) {
        logger.error('could not parse interactive-buttons response as json', e)
      }
    }

    logger.debug(`received response to interactive-buttons request: ${target}`)

    interactiveButtons.calls.push({
      url: target,
      params: body,
      headers: res.headers,
      statusCode: res.statusCode,
      type: 'response'
    })
  })

  return Promise.resolve()
}

interactiveButtons.addResponse = function (opts) {
  customResponses.set('interactive-buttons', opts)
}

interactiveButtons.reset = function () {
  logger.debug(`resetting interactive-buttons`)
  interactiveButtons.calls.splice(0, interactiveButtons.calls.length)
}

function reply (path, requestBody) {
  const url = `${responseUrlBase}${path.split('?')[0]}`

  logger.debug(`intercepted interactive-buttons request`)

  interactiveButtons.calls.push({
    url: url,
    params: utils.parseParams(path, requestBody),
    headers: this.req.headers,
    type: 'response_url'
  })

  return customResponses.get('interactive-buttons', url)
}
