'use strict'

const expect = require('chai').expect
const delay = require('delay')

describe('single team bot', function () {
  let slackMock
  const token = process.env.SLACK_TOKEN

  before(function () {
    slackMock = require('../../index').instance

    // required for bootstrap
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

    // this bot can only be bootstrapped once
    require('../single-team-bot')

    // wait for RTM flow to complete
    return delay(50)
  })

  beforeEach(function () {
    slackMock.reset()
  })

  after(function () {
    // clean up server
    return slackMock.rtm.stopServer(token)
  })

  it('should respond to hello with GO CUBS', function () {
    return slackMock.rtm.send(token, {
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
    return slackMock.rtm.send(token, {
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
