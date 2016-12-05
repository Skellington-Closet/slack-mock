'use strict'

const expect = require('chai').expect
const delay = require('delay')

describe('single team bot', function () {
  let slackMock
  const token = process.env.SLACK_TOKEN

  before(function () {
    slackMock = require('../../index').instance
  })

  beforeEach(function () {
    slackMock.reset()

    slackMock.web.addResponse({
      url: 'https://slack.com/api/rtm.start',
      status: 200,
      body: {
        ok: true,
        self: {
          name: 'mockSelf'
        },
        team: {
          name: 'mockTeam'
        }
      }
    })

    require('../single-team-bot')

    return delay(100) // wait for bot to bootstrap and connect to rtm
  })

  it('should respond to hello with GO CUBS', function () {
    return slackMock.rtm.send({
      token: token,
      type: 'message',
      channel: 'mockChannel',
      user: 'usr',
      text: 'hello'
    })
      .then(delay(50))
      .then(() => {
        expect(slackMock.rtm.calls).to.have.length(1)
        expect(slackMock.rtm.calls[0].message.text).to.equal('GO CUBS')
      })
  })

  it('should respond to howdy with GO TRIBE', function () {
    return slackMock.rtm.send({
      token: token,
      type: 'message',
      channel: 'mockChannel',
      user: 'usr',
      text: 'howdy'
    })
      .then(delay(50))
      .then(() => {
        expect(slackMock.rtm.calls).to.have.length(1)
        expect(slackMock.rtm.calls[0].message.text).to.equal('GO TRIBE')
      })
  })
})
