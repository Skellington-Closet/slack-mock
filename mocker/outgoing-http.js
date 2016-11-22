// mockers for:
// * events api: no response
// * slash commands: receives immediate response and sends response url, immediate response must be received within 3 seconds, response url within 30 minutes
// * outgoing webhooks: receives response
// * interactive messages

const outgoing = module.exports
const request = require('request')

outgoing._ = {}
outgoing._.init = function (config) {
  outgoing._.port = config.incomingPort
}

outgoing.events = {}
outgoing.events.addEventsPath = function (path) {

}

outgoing._.send = function (cfg) {
  request({
    uri: `http://localhost:${outgoing._.port}/${cfg.path}`,
    method: 'POST'
  })
}
