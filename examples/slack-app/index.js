'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const formParser = bodyParser.urlencoded({type: 'application/x-www-form-urlencoded', extended: false})
const app = express()
const controller = require('./controller')

// handle oauth callback and start bot
app.post('/oauth', controller.oauth)

// handle slash command
app.post('/slash', formParser, controller.slash)

app.post('/outgoing', bodyParser.json(), controller.outgoing)

app.post('/event', bodyParser.json(), controller.event)

app.post('/button', formParser, controller.button)

// need to use something like localtunnel to expose this server to the Internet
app.listen(9000, () => {
  console.log('slack app listening on 9000')

  // post to an incoming webhook once we're online
  require('request')({
    method: 'POST',
    url: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX',
    json: true,
    body: {
      text: 'hello world'
    }
  })
})

