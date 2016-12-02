'use strict'

const Ws = require('ws')
let lastMessageId = 0

module.exports.getInstance = function (token, info) {
  const rtm = new Ws(info.url, null, {agent: null})
  const bot = {}

  bot.identity = {
    id: info.self.id,
    name: info.self.name,
    team: {
      id: info.team.id,
      name: info.team.name
    }
  }

  bot.config = {
    token: token,
    rtm: rtm
  }

  bot.listeners = new Set()
  bot.on = on.bind(bot)
  bot.off = off.bind(bot)
  bot.reply = reply.bind(bot)

  rtm.on('open', () => {
    console.log(`connected to ${bot.identity.team.name} (${bot.identity.team.id}) as ${bot.identity.name} (${bot.identity.id})`)
  })

  rtm.on('error', (err) => {
    console.log('oh man, an error happened!', err)
    process.exit(1)
  })

  rtm.on('message', (event) => {
    try {
      const message = JSON.parse(event)
      if (message.type === 'message') {
        messageHandler(bot, message)
      }
    } finally {}
  })

  return bot
}

function messageHandler (bot, message) {
  for (let listener of bot.listeners) {
    let keepGoing = true

    if (listener.match.test(message.text)) {
      keepGoing = !!listener.handler(bot, message)
    }

    if (!keepGoing) {
      break
    }
  }
}

function on (match, cb) {
  const listener = {
    match: match, // should be a regex
    handler: cb
  }

  this.listeners.add(listener)

  return listener
}

function off (listener) {
  return this.listeners.remove(listener)
}

function reply (message, text) {
  const replyMessage = {
    id: ++lastMessageId,
    type: 'message',
    channel: message.channel,
    text: text
  }

  this.config.rtm.send(JSON.stringify(replyMessage), (err) => {
    if (err) {
      return console.log(`could not reply to message ${message.ts} in ${message.channel}`)
    }
  })
}
