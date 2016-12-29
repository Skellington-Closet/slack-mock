'use strict'

const events = module.exports
const request = require('request')
const logger = require('../lib/logger')

events.calls = []

events.send = function (target, data) {
  // the events api uses content-type application/json
  request({
    uri: target,
    method: 'POST',
    json: true,
    body: data
  }, (err, res, body) => {
    if (err) {
      return logger.error(`error receiving response to events api ${target}`, err)
    }

    logger.debug(`received response to events request`)

    events.calls.push({
      url: target,
      params: body,
      body: body, // remove in next major version
      headers: res.headers,
      statusCode: res.statusCode
    })
  })

  return Promise.resolve()
}

events.reset = function () {
  logger.debug(`resetting events`)
  events.calls.splice(0, events.calls.length)
}
