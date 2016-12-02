'use strict'

const slashCommands = module.exports
const request = require('request')
const nock = require('nock')
const logger = require('../lib/logger')
const utils = require('../lib/utils')
const customResponses = require('../lib/custom-responses')
let commandNumber = 0
const responseUrlBase = 'https://slash-commands.slack-mock'

nock(responseUrlBase)
  .persist()
  .post(/.*/, () => true)
  .reply(reply)

slashCommands.calls = []

slashCommands.send = function (target, data) {
  data.response_url = `${responseUrlBase}/${++commandNumber}`

  // slash commands use content-type application/x-www-form-urlencoded
  request({
    uri: target,
    method: 'POST',
    form: data
  }, (err, res, body) => {
    if (err) {
      return logger.error(`error receiving response to slash-commands ${target}`, err)
    }

    if (typeof body === 'string') {
      try {
        body = JSON.parse(body)
      } catch (e) {
        logger.error('could not parse slash-commands response as json', e)
      }
    }

    logger.debug(`received response to slash-commands request: ${target}`)

    slashCommands.calls.push({
      url: target,
      body: body,
      headers: res.headers,
      statusCode: res.statusCode,
      type: 'response'
    })
  })

  return Promise.resolve()
}

slashCommands.addResponse = function (opts) {
  customResponses.set('slash-commands', opts)
}

slashCommands.reset = function () {
  logger.debug(`resetting slash-commands`)
  slashCommands.calls.splice(0, slashCommands.calls.length)
}

function reply (path, requestBody) {
  const url = `${responseUrlBase}${path.split('?')[0]}`

  logger.debug(`intercepted slash-commands response_url request: ${url}`)

  slashCommands.calls.push({
    url: url,
    params: utils.parseParams(path, requestBody),
    headers: this.req.headers,
    type: 'response_url'
  })

  return customResponses.get('slash-commands', url)
}
