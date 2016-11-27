'use strict'

const outgoingWebhooks = module.exports
const request = require('request')
const logger = require('../lib/logger')

outgoingWebhooks.calls = []

outgoingWebhooks.send = function (targetUrl, outgoingBody) {
  request({
    method: 'POST',
    json: true,
    body: outgoingBody
  }, (err, res, body) => {
    if (err) {
      return logger.error(`error receiving response to outgoing webhook ${targetUrl}`, err)
    }

    outgoingWebhooks.calls.push({
      url: targetUrl,
      body: body,
      headers: res.headers,
      statusCode: res.statusCode
    })
  })

  return Promise.resolve()
}

outgoingWebhooks.reset = function () {
  outgoingWebhooks.calls.splice(0, outgoingWebhooks.calls.length)
}
