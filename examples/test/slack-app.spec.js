'use strict'

const expect = require('chai').expect
const delay = require('delay')
const _ = require('lodash')
const request = require('request')

describe('slack-app', function () {
  let slackMock
  const botToken = 'xoxb-XXXXXXXXXXXX-TTTTTTTTTTTTTT'

  before(function () {
    // wait for bot to get bootstrapped
    this.timeout(30000)
    slackMock = require('../../index').instance

    slackMock.reset()
    require('../slack-app')
  })

  after(function () {
    return slackMock.rtm.stopServer(botToken)
  })

  it('should start an rtm connection after the oauth flow', function (done) {
    slackMock.web.addResponse({
      url: 'https://slack.com/api/oauth.access',
      status: 200,
      body: {
        ok: true,
        access_token: 'xoxp-XXXXXXXX-XXXXXXXX-XXXXX',
        scope: 'incoming-webhook,commands,bot',
        team_name: 'Team Installing Your Hook',
        team_id: 'XXXXXXXXXX',
        bot: {
          bot_user_id: 'UTTTTTTTTTTR',
          bot_access_token: botToken
        }
      }
    })

    slackMock.web.addResponse({
      url: 'https://slack.com/api/rtm.start',
      status: 200,
      body: {
        ok: true,
        self: {
          name: 'mockSelf',
          id: 'Bmock'
        },
        team: {
          name: 'mockTeam',
          id: 'Tmock'
        }
      }
    })

    request({
      method: 'POST',
      uri: 'http://localhost:9000/oauth',
      qs: {
        code: 'abc123'
      }
    }, (err) => {
      if (err) {
        return done(err)
      }

      return delay(250) // wait for oauth flow to complete, rtm to be established
        .then(() => {
          return slackMock.rtm.send(botToken, {
            type: 'message',
            channel: 'mockChannel',
            user: 'usr',
            text: 'hello'})
        })
        .then(delay(20))
        .then(() => {
          expect(slackMock.rtm.calls).to.have.length(1)
          expect(slackMock.rtm.calls[0].message.text).to.equal('GO CUBS')
        })
        .then(() => done(), (e) => done(e))
    })
  })

  it('should post incoming webhook on startup', function () {
    expect(slackMock.incomingWebhooks.calls).to.have.length(1)

    const firstCall = slackMock.incomingWebhooks.calls[0]

    expect(firstCall.params.text).to.equal('hello world')
  })

  it('should reply to a slash command', function () {
    const command = {
      token: 'IkuvaNzQIHg97ATvDxqgjtO',
      team_id: 'T0001',
      team_domain: 'example',
      channel_id: 'C2147483705',
      channel_name: 'test',
      user_id: 'U2147483697',
      user_name: 'Steve',
      command: '/secret',
      text: 'hello'
    }

    return slackMock.slashCommands.send('http://localhost:9000/slash', command)
      .then(delay(75))
      .then(() => {
        expect(slackMock.slashCommands.calls).to.have.length(2)

        const responseUrlCall = _.find(slackMock.slashCommands.calls, {type: 'response_url'})
        expect(responseUrlCall.params.text).to.equal('GO CUBS')
        expect(responseUrlCall.params.response_type).to.equal('ephemeral')
      })
  })

  it('should reply to an outgoing webhooks', function () {
    const command = {
      token: 'IkuvaNzQIHg97ATvDxqgjtO',
      team_id: 'T0001',
      team_domain: 'example',
      channel_id: 'C2147483705',
      channel_name: 'test',
      user_id: 'U2147483697',
      user_name: 'Steve',
      text: 'hello'
    }

    return slackMock.outgoingWebhooks.send('http://localhost:9000/outgoing', command)
      .then(delay(50))
      .then(() => {
        expect(slackMock.outgoingWebhooks.calls).to.have.length(1)
        const firstCall = slackMock.outgoingWebhooks.calls[0]
        expect(firstCall.params.text).to.equal('GO CUBS')
      })
  })

  it('should reply to an event payload', function () {
    const command = {
      token: 'IkuvaNzQIHg97ATvDxqgjtO',
      team_id: 'T0001',
      team_domain: 'example',
      channel_id: 'C2147483705',
      channel_name: 'test',
      user_id: 'U2147483697',
      user_name: 'Steve',
      text: 'hello'
    }

    return slackMock.events.send('http://localhost:9000/event', command)
      .then(delay(50))
      .then(() => {
        expect(slackMock.events.calls).to.have.length(1)
        const firstCall = slackMock.events.calls[0]
        expect(firstCall.statusCode).to.equal(200)
      })
  })

  it('should reply to an interactive button message', function () {
    const command = {
      token: 'IkuvaNzQIHg97ATvDxqgjtO',
      team_id: 'T0001',
      team_domain: 'example',
      channel_id: 'C2147483705',
      channel_name: 'test',
      user_id: 'U2147483697',
      user_name: 'Steve',
      command: '/secret',
      text: 'hello'
    }

    slackMock.interactiveButtons.addResponse({statusCode: 201})

    return slackMock.interactiveButtons.send('http://localhost:9000/button', command)
      .then(delay(75))
      .then(() => {
        expect(slackMock.interactiveButtons.calls).to.have.length(2)

        const responseUrlCall = _.find(slackMock.interactiveButtons.calls, {type: 'response_url'})
        expect(responseUrlCall.params.text).to.equal('GO CUBS')
      })
  })
})
