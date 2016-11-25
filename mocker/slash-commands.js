'use strict'

const slashCommands = module.exports
const request = require('request')
const nock = require('nock')
const qs = require('qs')
const logger = require('../lib/logger')
let commandNumber = 0

nock('https://slack-mock/slash-command')
  .post(/.*/, () => true)
  .reply(reply)

slashCommands.calls = []

slashCommands.send = function (target, data) {
  data.response_url = `https://slack-mock/slash-command/${++commandNumber}`

  // slash commands use content-type application/x-www-form-urlencoded
  request({
    uri: target,
    method: 'POST',
    form: data
  }, (err, res, body) => {
    if (err) {
      return logger.error(`error receiving response to slash command ${target}`, err)
    }

    if (typeof body === 'string') {
      try {
        body = JSON.parse(body)
      } catch (e) {
        logger.error('could not parse slash command response as json', e)
      }
    }

    slashCommands.calls.push({
      url: target,
      body: body,
      headers: res.headers,
      statusCode: res.statusCode,
      type: 'response'
    })
  })
}

slashCommands.reset = function () {
  slashCommands.calls.splice(0, slashCommands.calls.length)
}

function reply (uri, requestBody) {
  if (typeof requestBody === 'string') {
    requestBody = qs.parse(requestBody)
  }

  slashCommands.calls.push({
    url: `https://slack-mock/slash-command${uri}`,
    body: requestBody,
    headers: this.req.headers,
    type: 'response_url'
  })

  return [
    200,
    'OK'
  ]
}
