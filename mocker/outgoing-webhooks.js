'use strict'

const outgoingWebhooks = module.exports
const request = require('request')
const logger = require('../lib/logger')

outgoingWebhooks.calls = []
outgoingWebhooks.send = function (fromPath, data) {
  request({
    method: 'POST',
    json: true,
    body: data
  }, (err, res, body) => {
    if (err) {
      return logger.error(`error receiving response to outgoing webhook ${fromPath}`, err)
    }

    outgoingWebhooks.calls.push({
      url: fromPath,
      body: body,
      headers: res.headers,
      statusCode: res.status
    })
  })
}

outgoingWebhooks.reset = function () {
  outgoingWebhooks.calls.splice(0, outgoingWebhooks.calls.length)
}
