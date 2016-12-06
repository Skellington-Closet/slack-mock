'use strict'

const chai = require('chai')
const expect = chai.expect
const sinon = require('sinon')
const proxyquire = require('proxyquire').noCallThru()

chai.use(require('sinon-chai'))

describe('slack-mock', function () {
  let eventsMock
  let incomingWebhooksMock
  let interactiveButtonsMock
  let outgoingWebhooksMock
  let rtmMock
  let slashCommandsMock
  let webMock
  let loggerMock
  let mocker

  beforeEach(function () {
    loggerMock = {
      error: sinon.stub(),
      info: sinon.stub(),
      debug: sinon.stub()
    }

    eventsMock = {
      send: sinon.stub(),
      reset: sinon.stub(),
      calls: []
    }

    incomingWebhooksMock = {
      addResponse: sinon.stub(),
      reset: sinon.stub(),
      calls: []
    }

    interactiveButtonsMock = {
      addResponse: sinon.stub(),
      send: sinon.stub(),
      reset: sinon.stub(),
      calls: []
    }

    outgoingWebhooksMock = {
      send: sinon.stub(),
      reset: sinon.stub(),
      calls: []
    }

    rtmMock = {
      _: { init: sinon.stub() },
      send: sinon.stub(),
      reset: sinon.stub(),
      calls: [],
      stopServer: sinon.stub(),
      startServer: sinon.stub()
    }

    slashCommandsMock = {
      addResponse: sinon.stub(),
      send: sinon.stub(),
      reset: sinon.stub(),
      calls: []
    }

    webMock = {
      addResponse: sinon.stub(),
      reset: sinon.stub(),
      calls: []
    }

    mocker = proxyquire('../src/index', {
      './mocker/events': eventsMock,
      './mocker/incoming-webhooks': incomingWebhooksMock,
      './mocker/interactive-buttons': interactiveButtonsMock,
      './mocker/outgoing-webhooks': outgoingWebhooksMock,
      './mocker/rtm': rtmMock,
      './mocker/slash-commands': slashCommandsMock,
      './mocker/web': webMock,
      './lib/logger': loggerMock
    })
  })

  describe('init', function () {
    it('should init the rtm mocker with default port', function () {
      mocker()
      expect(rtmMock._.init).to.be.calledWith({rtmPort: 9001})
    })

    it('should init the rtm mocker with passed port', function () {
      mocker({rtmPort: 9002})
      expect(rtmMock._.init).to.be.calledWith({rtmPort: 9002})
    })

    it('should set the logger level', function () {
      mocker({logLevel: 'debug'})
      expect(loggerMock.level).to.equal('debug')
    })

    it('should return the same instance when called twice', function () {
      const instance1 = mocker()
      const instance2 = mocker({logLevel: 'debug', rtmPort: 9002})

      expect(instance1).to.equal(instance2)

      // don't reconfigure
      expect(loggerMock.level).not.to.exist
      expect(rtmMock._.init).to.be.calleOnce
      expect(rtmMock._.init).to.be.calledWith({rtmPort: 9001})
    })
  })

  describe('api', function () {
    let instance

    beforeEach(function () {
      instance = mocker()
    })

    it('should expose events api', function () {
      expect(instance.events).to.have.keys(['send', 'reset', 'calls'])
      expect(instance.events.send, 'send').to.equal(eventsMock.send)
      expect(instance.events.reset, 'reset').to.equal(eventsMock.reset)
      expect(instance.events.calls, 'calls').to.equal(eventsMock.calls)
    })

    it('should expose incoming webhooks api', function () {
      expect(instance.incomingWebhooks).to.have.keys(['addResponse', 'reset', 'calls'])
      expect(instance.incomingWebhooks.addResponse, 'addResponse').to.equal(incomingWebhooksMock.addResponse)
      expect(instance.incomingWebhooks.reset, 'reset').to.equal(incomingWebhooksMock.reset)
      expect(instance.incomingWebhooks.calls, 'calls').to.equal(incomingWebhooksMock.calls)
    })

    it('should expose interactive buttons api', function () {
      expect(instance.interactiveButtons).to.have.keys(['addResponse', 'send', 'reset', 'calls'])
      expect(instance.interactiveButtons.addResponse, 'addResponse').to.equal(interactiveButtonsMock.addResponse)
      expect(instance.interactiveButtons.send, 'send').to.equal(interactiveButtonsMock.send)
      expect(instance.interactiveButtons.reset, 'reset').to.equal(interactiveButtonsMock.reset)
      expect(instance.interactiveButtons.calls, 'calls').to.equal(interactiveButtonsMock.calls)
    })

    it('should expose outgoing webhooks api', function () {
      expect(instance.outgoingWebhooks).to.have.keys(['send', 'reset', 'calls'])
      expect(instance.outgoingWebhooks.send, 'send').to.equal(outgoingWebhooksMock.send)
      expect(instance.outgoingWebhooks.reset, 'reset').to.equal(outgoingWebhooksMock.reset)
      expect(instance.outgoingWebhooks.calls, 'calls').to.equal(outgoingWebhooksMock.calls)
    })

    it('should expose rtm api', function () {
      expect(instance.rtm).to.have.keys(['send', 'reset', 'calls', 'stopServer', 'startServer'])
      expect(instance.rtm.send, 'send').to.equal(rtmMock.send)
      expect(instance.rtm.reset, 'reset').to.equal(rtmMock.reset)
      expect(instance.rtm.calls, 'calls').to.equal(rtmMock.calls)
      expect(instance.rtm.stopServer, 'stopServer').to.equal(rtmMock.stopServer)
      expect(instance.rtm.startServer, 'startServer').to.equal(rtmMock.startServer)
    })

    it('should expose slash commands api', function () {
      expect(instance.slashCommands).to.have.keys(['addResponse', 'send', 'reset', 'calls'])
      expect(instance.slashCommands.addResponse, 'addResponse').to.equal(slashCommandsMock.addResponse)
      expect(instance.slashCommands.send, 'send').to.equal(slashCommandsMock.send)
      expect(instance.slashCommands.reset, 'reset').to.equal(slashCommandsMock.reset)
      expect(instance.slashCommands.calls, 'calls').to.equal(slashCommandsMock.calls)
    })

    it('should expose web api', function () {
      expect(instance.web).to.have.keys(['addResponse', 'reset', 'calls'])
      expect(instance.web.addResponse, 'addResponse').to.equal(webMock.addResponse)
      expect(instance.web.reset, 'reset').to.equal(webMock.reset)
      expect(instance.web.calls, 'calls').to.equal(webMock.calls)
    })

    it('should expose a reset method', function () {
      instance.reset()

      expect(eventsMock.reset, 'events').to.have.been.called
      expect(incomingWebhooksMock.reset, 'incoming webhooks').to.have.been.called
      expect(interactiveButtonsMock.reset, 'interactive buttons').to.have.been.called
      expect(outgoingWebhooksMock.reset, 'outgoing webhooks').to.have.been.called
      expect(rtmMock.reset, 'rtm').to.have.been.called
      expect(slashCommandsMock.reset, 'slash commands').to.have.been.called
      expect(webMock.reset, 'web').to.have.been.called
    })
  })
})
