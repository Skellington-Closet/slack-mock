'use strict'

const chai = require('chai')
const expect = chai.expect
const sinon = require('sinon')
const proxyquire = require('proxyquire').noCallThru()

chai.use(require('sinon-chai'))

describe('mocker: outgoing webhooks', function () {
  let requestMock
  let resMock
  let headersMock
  let bodyMock
  let loggerMock
  let outgoingWebhooks
  let target
  let data

  before(function () {
    loggerMock = {
      error: sinon.stub(),
      info: sinon.stub(),
      debug: sinon.stub()
    }

    requestMock = sinon.stub()

    outgoingWebhooks = proxyquire('../../src/mocker/outgoing-webhooks', {
      'request': requestMock,
      '../lib/logger': loggerMock
    })
  })

  beforeEach(function () {
    target = 'http://gus.fring'
    data = {ding: 'ding'}

    bodyMock = {walter: 'white'}
    headersMock = {channel: 'AMC'}
    resMock = {
      headers: headersMock,
      statusCode: 200
    }

    requestMock.reset()
    requestMock.yields(null, resMock, bodyMock)

    loggerMock.error.reset()
    loggerMock.info.reset()
    loggerMock.debug.reset()

    outgoingWebhooks.reset()
  })

  describe('send and calls', function () {
    it('should record a successful response', function () {
      return outgoingWebhooks.send(target, data)
        .then(() => {
          expect(outgoingWebhooks.calls).to.have.length(1)

          const firstCall = outgoingWebhooks.calls[0]
          expect(firstCall).to.have.keys(['url', 'params', 'headers', 'statusCode'])

          expect(firstCall.url).to.equal(target)
          expect(firstCall.params).to.equal(bodyMock)
          expect(firstCall.headers).to.equal(headersMock)
          expect(firstCall.statusCode).to.equal(resMock.statusCode)
        })
    })

    it('should log an error if request fails', function () {
      const error = new Error('GUS')
      requestMock.yields(error)

      return outgoingWebhooks.send(target, data)
        .then(() => {
          expect(outgoingWebhooks.calls).to.have.length(0)
          expect(loggerMock.error).to.have.been.called
        })
    })
  })

  describe('reset', function () {
    it('should clear calls array', function () {
      return outgoingWebhooks.send(target, data)
        .then(() => {
          expect(outgoingWebhooks.calls).to.have.length(1)
          outgoingWebhooks.reset()
          expect(outgoingWebhooks.calls).to.have.length(0)
        })
    })
  })
})
