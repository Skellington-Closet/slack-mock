'use strict'

const api = require('./api')
const controller = module.exports

// handles oauth callbacks
controller.oauth = function (req, res) {
  res.redirect('https://github.com/Skellington-Closet/skellington')

  api.oauth.access(req.query.code, (err, token) => {
    if (err) {
      return console.log(err)
    }

    startRtm(token)
  })
}

// handles slash command
controller.slash = function (req, res) {
  res.status(200).send({hello: 'world'})

  const response = {
    text: /hello/.test(req.body.text) ? 'GO CUBS' : 'GO TRIBE',
    response_type: 'ephemeral'
  }

  require('request')({
    uri: req.body.response_url,
    method: 'POST',
    form: response
  })
}

controller.outgoing = function (req, res) {
  res.status(200).send({text: 'GO CUBS'})
}

controller.event = function (req, res) {
  res.status(200).send()
}

controller.button = function (req, res) {
  res.status(200).send({hello: 'world'})

  const response = {
    text: /hello/.test(req.body.text) ? 'GO CUBS' : 'GO TRIBE'
  }

  require('request')({
    uri: req.body.response_url,
    method: 'POST',
    json: true,
    body: response
  }, (err, res) => {
    if (err) {
      return console.log(err)
    }
    console.log(res.statusCode)
  })
}

// starts the rtm connection
function startRtm (token) {
  api.rtm.start(token, (err, bot) => {
    if (err) {
      return console.log(err)
    }

    bot.on(/hello/, (bot, message) => {
      bot.reply(message, 'GO CUBS')
    })

    bot.on(/howdy/, (bot, message) => {
      bot.reply(message, 'GO TRIBE')
    })
  })
}
