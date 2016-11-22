const web = module.exports
const nock = require('nock')
const qs = require('qs')
const responses = require('./web-responses')

web.calls = []

web._ = {}

web._.init = function () {
  // Slack accepts both GET and POST requests
  nock('https://slack.com/api')
    .persist()
    .get(/.*/)
    .query(true)
    .reply(reply) // TODO test GET requests

    .post(/.*/, () => true)
    .reply(reply)
}

web.reset = function () {
  web.calls.splice(0, web.calls.length)
  responses._.reset()
}

function reply (uri, requestBody) {
  const action = uri.replace('/api/', '')
  const response = responses._.getResponse(action)

  if (typeof requestBody === 'string') {
    requestBody = qs.parse(requestBody)
  }

  web.calls.push({
    action: action,
    body: requestBody,
    headers: this.req.headers
  })

  return [
    response.status,
    response.body,
    response.headers
  ]
}
