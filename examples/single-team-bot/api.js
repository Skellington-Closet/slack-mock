const request = require('request')
const _ = require('lodash')
const token = process.env.SLACK_TOKEN
const api = module.exports
const botFactory = require('./botFactory')

api.rtm = {}
api.rtm.start = function (cb) {
  apiRequest('rtm.start', {
    no_unreads: true,
    simple_latest: true
  }, rtmStart)

  function rtmStart (err, res, body) {
    if (err || res.statusCode >= 400 || !body.ok) {
      return cb(new Error('Error starting RTM', err || body))
    }

    const bot = botFactory.getInstance(token, body)
    cb(null, bot)
  }
}

function apiRequest (method, data, cb) {
  if (!cb) {
    cb = data
    data = {}
  }

  request({
    method: 'GET',
    uri: `https://slack.com/api/${method}`,
    json: true,
    qs: _.merge({token: token}, data)
  }, cb)
}
