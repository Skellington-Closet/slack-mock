'use strict'

const outgoingWebhooks = module.exports
const request = require('request')
const logger = require('../lib/logger')

outgoingWebhooks.calls = []
outgoingWebhooks.send = function (target, data) {
  request({
    method: 'POST',
    json: true,
    body: data
  }, (err, res, body) => {
    if (err) {
      return logger.error(`error receiving response to outgoing webhook ${target}`, err)
    }

    outgoingWebhooks.calls.push({
      url: target,
      body: body,
      headers: res.headers,
      statusCode: res.status
    })
  })
}

outgoingWebhooks.reset = function () {
  outgoingWebhooks.calls.splice(0, outgoingWebhooks.calls.length)
}
