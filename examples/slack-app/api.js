'use strict'

const request = require('request')
const api = module.exports
const botFactory = require('./botFactory')

api.oauth = {}
api.oauth.access = function (code, cb) {
  const data = {
    // you can get these values by registering a new app at https://api.slack.com/apps
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
    code: code
  }

  apiRequest(null, 'oauth.access', data, (err, body) => {
    if (err) {
      return cb(err)
    }

    cb(null, body.bot.bot_access_token)
  })
}

api.rtm = {}
api.rtm.start = function (token, cb) {
  const data = {
    no_unreads: true,
    simple_latest: true
  }

  apiRequest(token, 'rtm.start', data, (err, body) => {
    if (err) {
      return cb(err)
    }

    cb(null, botFactory.getInstance(token, body))
  })
}

function apiRequest (token, method, data, cb) {
  if (!cb) {
    cb = data
    data = {}
  }

  if (token) {
    data.token = token
  }

  request({
    method: 'GET',
    uri: `https://slack.com/api/${method}`,
    json: true,
    qs: data
  }, function (err, res, body) {
    if (err || res.statusCode >= 400 || !body.ok) {
      return cb(err || body)
    }

    cb(null, body)
  })
}
