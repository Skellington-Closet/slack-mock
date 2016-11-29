'use strict'

const chai = require('chai')
const expect = chai.expect
const sinon = require('sinon')
const proxyquire = require('proxyquire').noCallThru()
const request = require('request')

chai.use(require('sinon-chai'))

describe('mocker: incoming webhooks', function () {
  let loggerMock
  let incomingWebhooks
  let utilsMock
  let customResponsesMock

  before(function () {
    loggerMock = {
      error: sinon.stub(),
      info: sinon.stub(),
      debug: sinon.stub()
    }

    customResponsesMock = {
      get: sinon.stub(),
      reset: sinon.stub(),
      set: sinon.stub()
    }

    utilsMock = {
      parseParams: sinon.stub()
    }

    // I ran into some weird scoping issues by redefining this in a beforeEach
    // moving to a before() fixed them
    incomingWebhooks = proxyquire('../../mocker/incoming-webhooks', {
      '../lib/logger': loggerMock,
      '../lib/custom-responses': customResponsesMock,
      '../lib/utils': utilsMock
    })
  })

  beforeEach(function () {
    loggerMock.error.reset()
    loggerMock.info.reset()
    loggerMock.debug.reset()

    utilsMock.parseParams.reset()
    utilsMock.parseParams.returns({parsed: 'body'})

    customResponsesMock.get.reset()
    customResponsesMock.set.reset()
    customResponsesMock.reset.reset()
    customResponsesMock.get.returns(200, 'OK', {})

    incomingWebhooks.reset()
  })

  function sendToUrl (url, body, cb) {
    request({
      method: 'POST',
      uri: url,
      json: true,
      body: body
    }, cb)
  }

  describe('register', function () {
    let url

    beforeEach(function () {
      url = 'http://register.not.real'
    })

    it('should register a url', function (done) {
      sendToUrl(url, {}, beforeRegister)

      function beforeRegister (err) {
        expect(err).to.exist

        incomingWebhooks.register(url)
        sendToUrl(url, {}, afterRegister)
      }

      function afterRegister (err) {
        expect(err).not.to.exist

        expect(customResponsesMock.get).to.have.been.calledWith('incoming-webhooks', url)
        done()
      }
    })
  })

  describe('addResponse', function () {
    let url

    beforeEach(function () {
      url = 'http://addResponse.not.real'
      incomingWebhooks.register(url)
    })

    it('should add a custom response', function () {
      const opts = {
        url: url,
        statusCode: 500,
        body: {not: 'ok'},
        headers: {walter: 'white'}
      }

      incomingWebhooks.addResponse(opts)

      expect(customResponsesMock.set).to.have.been.calledWith('incoming-webhooks', opts)
    })
  })

  describe('calls', function () {
    let url

    beforeEach(function () {
      url = 'http://calls.not.real'
      incomingWebhooks.register(url)
    })

    it('should record calls', function (done) {
      const body = {
        walter: 'white'
      }

      sendToUrl(url, body, () => {
        expect(utilsMock.parseParams).to.have.been.calledWith('/', {walter: 'white'})
        expect(incomingWebhooks.calls).to.have.length(1)

        const firstCall = incomingWebhooks.calls[0]
        expect(firstCall).to.have.keys(['url', 'body', 'headers'])
        expect(firstCall.url).to.equal(url)
        expect(firstCall.body).to.deep.equal({parsed: 'body'})
        expect(firstCall.headers).to.exist

        done()
      })
    })

    it('should record application/x-www-form-urlencoded body as an object', function (done) {
      const formBody = {
        walter: 'white'
      }

      request({
        method: 'POST',
        uri: url,
        form: formBody
      }, () => {
        expect(utilsMock.parseParams).to.have.been.calledWith('/', 'walter=white')
        expect(incomingWebhooks.calls).to.have.length(1)
        const firstCall = incomingWebhooks.calls[0]
        expect(firstCall.body).to.deep.equal({parsed: 'body'})

        done()
      })
    })
  })

  describe('reset', function () {
    let url

    beforeEach(function () {
      url = 'http://reset.not.real'
      incomingWebhooks.register(url)
    })

    it('should reset call count', function (done) {
      sendToUrl(url, {}, () => {
        expect(incomingWebhooks.calls).to.have.length(1)
        incomingWebhooks.reset()
        expect(incomingWebhooks.calls).to.have.length(0)

        done()
      })
    })

    it('should reset queued responses', function () {
      incomingWebhooks.reset()
      expect(customResponsesMock.reset).to.have.been.calledWith('incoming-webhooks')
    })
  })
})
