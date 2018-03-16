'use strict'

const chai = require('chai')
const expect = chai.expect
const sinon = require('sinon')
const proxyquire = require('proxyquire').noCallThru()

chai.use(require('sinon-chai'))

describe('mocker: rtm', function () {
  let rtm
  let wsMock
  let wsServerMock
  let wsClientMock
  let expressMock
  let expressAppMock
  let serverMock
  let loggerMock

  before(function () {
    wsClientMock = {
      send: sinon.stub(),
      on: sinon.stub()
    }

    wsServerMock = {
      on: sinon.stub(),
      close: sinon.stub(),
      clients: [wsClientMock]
    }

    wsMock = {
      Server: sinon.stub()
    }

    serverMock = {
      close: sinon.stub().yields()
    }

    expressAppMock = {
      listen: sinon.stub().returns(serverMock)
    }

    expressMock = sinon.stub().returns(expressAppMock)

    loggerMock = {
      error: sinon.stub(),
      info: sinon.stub(),
      debug: sinon.stub()
    }

    rtm = proxyquire('../../src/mocker/rtm', {
      'ws': wsMock,
      'express': expressMock,
      '../lib/logger': loggerMock
    })
  })

  beforeEach(function () {
    rtm.reset()

    loggerMock.error.reset()
    loggerMock.info.reset()
    loggerMock.debug.reset()

    wsClientMock.send.reset()
    wsClientMock.on.reset()
    wsClientMock.send.yields()

    wsServerMock.on.reset()
    wsServerMock.close.reset()
    wsServerMock.close.yields()

    wsMock.Server.reset()
    wsMock.Server.returns(wsServerMock)

    expressAppMock.listen.reset()
    expressAppMock.listen.yields()
    expressAppMock.listen.returns(serverMock)

    expressMock.reset()
    expressMock.returns(expressAppMock)
  })

  describe('init', function () {
    it('should start the express server', function () {
      rtm._.init({rtmPort: 9000})
      expect(expressAppMock.listen).to.have.been.calledWith(9000)
    })
  })

  describe('addToken', function () {
    let token

    beforeEach(function () {
      token = 'abc123'
      // create server
      rtm._.init({rtmPort: 9001})
    })

    afterEach(function () {
      rtm.stopServer('abc123')
    })

    it('should start the websocket client once', function () {
      const rtmUrl1 = rtm._.addToken(token)
      const rtmUrl2 = rtm._.addToken(token)

      expect(wsMock.Server).to.have.been.calledOnce
      expect(rtmUrl1).to.equal(rtmUrl2)
      expect(rtmUrl1).to.equal('ws://localhost:9001/abc123')

      expect(wsMock.Server).to.have.been.calledWith({
        server: serverMock,
        path: `/${token}`,
        clientTracking: true
      })
    })

    it('should register a message listener on the client', function () {
      rtm._.addToken(token)

      const connectionCb = wsServerMock.on.args[0][1]
      connectionCb(wsClientMock)

      expect(wsClientMock.on).to.have.been.calledWith('message')
    })

    describe('message recording', function () {
      let messageCb

      beforeEach(function () {
        rtm._.addToken(token)
        const connectionCb = wsServerMock.on.args[0][1]
        connectionCb(wsClientMock)
        messageCb = wsClientMock.on.args[0][1]
      })

      it('should record a message to the client', function () {
        const message = JSON.stringify({hello: 'world', token: token})
        messageCb(message)

        expect(rtm.calls).to.have.length(1)
        expect(rtm.calls[0]).to.have.keys(['rawMessage', 'message', 'token'])
        expect(rtm.calls[0].message.hello).to.equal('world')
        expect(rtm.calls[0].token).to.equal(token)
        expect(rtm.calls[0].rawMessage).to.equal(message)
      })

      it('should record a message even if it is unparseable', function () {
        const message = '{hello:'
        messageCb(message)

        expect(rtm.calls).to.have.length(1)
        expect(rtm.calls[0].message).to.equal(null)
        expect(rtm.calls[0].token).to.equal(null)
        expect(rtm.calls[0].rawMessage).to.equal('{hello:')
      })
    })
  })

  describe('send', function () {
    let token

    beforeEach(function () {
      token = 'crystalbluepersuation'
      rtm._.init({rtmPort: 9001}) // create server
      rtm._.addToken(token) // create server
    })

    it('should send a message', function () {
      return rtm.send(token, {walter: 'white'})
        .then(() => {
          expect(wsClientMock.send).to.have.been.calledWith(`{"walter":"white"}`)
        })
    })

    it('should reject if there is no server for a token', function () {
      return rtm.send('capncook', {walter: 'white'})
        .then(() => {
          throw new Error('expected promise to fail.')
        })
        .catch((e) => {
          expect(e.message).to.match(/client with token/)
        })
    })

    it('should reject if message could not be stringified', function () {
      const parseError = new Error('could not parse')

      sinon.stub(JSON, 'stringify')
      JSON.stringify.throws(parseError)

      return rtm.send(token, {walter: 'white'})
        .then(() => {
          throw new Error('expected promise to fail.')
        })
        .catch((e) => {
          expect(e).to.equal(parseError)
        })
        .then(restore, restore)

      function restore () {
        JSON.stringify.restore()
      }
    })

    it('should reject if there was an error with the send', function () {
      const sendError = new Error('could not send')
      wsClientMock.send.yields(sendError)

      return rtm.send(token, {walter: 'white'})
        .then(() => {
          throw new Error('expected promise to fail.')
        })
        .catch((e) => {
          expect(e).to.equal(sendError)
        })
    })
  })

  describe('reset', function () {
    it('should clear calls array', function () {
      rtm.calls.push(wsClientMock)
      rtm.reset()
      expect(rtm.calls).to.have.length(0)
    })
  })

  describe('startServer', function () {
    beforeEach(function () {
      sinon.stub(rtm._, 'addToken')
    })

    afterEach(function () {
      rtm._.addToken.restore()
    })

    it('should call addToken', function () {
      rtm.startServer('abc123')
      expect(rtm._.addToken).to.have.been.calledWith('abc123')
    })
  })

  describe('stopServer', function () {
    let token

    beforeEach(function () {
      token = 'heisenberg'
      rtm.startServer(token)
      wsServerMock.close.reset()
      wsServerMock.close.yields()
    })

    it('should stop the server if it exists', function () {
      return rtm.stopServer(token)
        .then(() => {
          expect(wsServerMock.close).to.have.been.called
          expect(serverMock.close).to.have.been.called
        })
    })

    it('should re-create a server after server is stopped', function () {
      return rtm.stopServer(token)
        .then(() => {
          wsMock.Server.reset()
          rtm._.addToken('abc123')
        })
        .then(() => {
          expect(wsMock.Server).to.have.been.calledOnce
        })
    })

    it('should resolve if server does not exists', function () {
      return rtm.stopServer('notreal')
        .then(() => {
          expect(wsServerMock.close).not.to.have.been.called
          expect(serverMock.close).to.have.been.called
        })
    })

    it('should reject if there is an error closing the server', function () {
      const err = new Error('GUS FRING')
      wsServerMock.close.yields(err)

      return rtm.stopServer(token)
        .then(() => {
          throw new Error('expected promise to fail.')
        })
        .catch((e) => {
          expect(wsServerMock.close).to.have.been.called
          expect(e).to.equal(err)
        })
    })
  })
})
