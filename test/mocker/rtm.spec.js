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
  let loggerMock

  before(function () {
    wsClientMock = {
      close: sinon.stub(),
      send: sinon.stub().yields(),
      on: sinon.stub()
    }

    wsServerMock = {
      on: sinon.stub()
    }

    wsMock = {
      Server: sinon.stub().returns(wsServerMock)
    }

    loggerMock = {
      error: sinon.stub(),
      info: sinon.stub(),
      debug: sinon.stub()
    }

    rtm = proxyquire('../../mocker/rtm', {
      'ws': wsMock,
      '../lib/logger': loggerMock
    })
  })

  beforeEach(function () {
    loggerMock.error.reset()
    loggerMock.info.reset()
    loggerMock.debug.reset()

    rtm.reset()
  })

  describe('init', function () {
    it('should set the rtm url', function () {
      rtm._.init({rtmPort: 9000})
      expect(rtm._.url).to.equal('ws://localhost:9000')
    })

    it('should start the websocket server', function () {
      rtm._.init({rtmPort: 9000})
      expect(wsMock.Server).to.have.been.calledWith({port: 9000})

      expect(wsServerMock.on).to.have.been.calledWith('connection')
    })
  })

  describe('websocket', function () {
    beforeEach(function () {
      rtm._.init({rtmPort: 9000})
    })

    describe('server connection', function () {
      it('should add client to clients array', function () {
        const connectionCb = wsServerMock.on.args[0][1]
        connectionCb(wsClientMock)

        expect(rtm.clients).to.have.length(1)
        expect(rtm.clients[0]).to.equal(wsClientMock)
      })

      it('should register a message listener on the client', function () {
        const connectionCb = wsServerMock.on.args[0][1]
        connectionCb(wsClientMock)

        expect(wsClientMock.on).to.have.been.calledWith('message')
      })
    })

    describe('message recording', function () {
      let messageCb

      beforeEach(function () {
        const connectionCb = wsServerMock.on.args[0][1]
        connectionCb(wsClientMock)
        messageCb = wsClientMock.on.args[0][1]
      })

      it('should record a message to the client', function () {
        const message = JSON.stringify({hello: 'world'})
        messageCb(message)

        expect(rtm.calls).to.have.length(1)
        expect(rtm.calls[0]).to.have.keys(['rawMessage', 'client', 'message'])
        expect(rtm.calls[0].message.hello).to.equal('world')
        expect(rtm.calls[0].rawMessage).to.equal(message)
        expect(rtm.calls[0].client).to.equal(wsClientMock)
      })

      it('should record a message even if it is unparseable', function () {
        const message = '{hello:'
        messageCb(message)

        expect(rtm.calls).to.have.length(1)
        expect(rtm.calls[0].message).to.equal(null)
        expect(rtm.calls[0].rawMessage).to.equal('{hello:')
        expect(rtm.calls[0].client).to.equal(wsClientMock)
      })
    })
  })

  describe('send', function () {
    beforeEach(function () {

    })

    it('should send a message', function () {
      return rtm.send({walter: 'white'}, wsClientMock)
        .then(() => {
          expect(wsClientMock.send).to.have.been.calledWith('{"walter":"white"}')
        })
    })

    it('should reject if message could not be stringified', function () {
      const parseError = new Error('could not parse')

      sinon.stub(JSON, 'stringify')
      JSON.stringify.throws(parseError)

      return rtm.send({walter: 'white'}, wsClientMock)
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

      return rtm.send({walter: 'white'}, wsClientMock)
        .then(() => {
          throw new Error('expected promise to fail.')
        })
        .catch((e) => {
          expect(e).to.equal(sendError)
        })
    })
  })

  describe('broadcast', function () {
    let client1
    let client2

    beforeEach(function () {
      client1 = {close: sinon.stub()}
      client2 = {close: sinon.stub()}

      rtm.clients.push(client1)
      rtm.clients.push(client2)
    })

    it('should call send for all clients', function () {
      rtm.send = sinon.stub().returns(Promise.resolve())

      return rtm.broadcast('message')
        .then(() => {
          expect(rtm.send).to.have.been.calledTwice
          expect(rtm.send.args[0]).to.deep.equal(['message', client1])
          expect(rtm.send.args[1]).to.deep.equal(['message', client2])
        })
    })

    it('should send to all clients even if one fails', function () {
      const err = new Error('DING DING')
      rtm.send = sinon.stub()
      rtm.send.onCall(0).returns(Promise.reject(err))
      rtm.send.onCall(1).returns(Promise.resolve())

      return rtm.broadcast('message')
        .then(() => {
          expect(rtm.send).to.have.been.calledTwice
        })
    })
  })

  describe('reset', function () {
    it('should clear calls array', function () {
      rtm.calls.push(wsClientMock)
      rtm.reset()
      expect(rtm.calls).to.have.length(0)
    })

    it('should close clients and clear clients array', function () {
      rtm.clients.push(wsClientMock)
      rtm.reset()
      expect(rtm.clients).to.have.length(0)
      expect(wsClientMock.close).to.have.been.called
    })
  })
})
