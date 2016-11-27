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

  before(function () {
    loggerMock = {
      error: sinon.stub(),
      info: sinon.stub(),
      debug: sinon.stub()
    }

    // I ran into some weird scoping issues by redefining this in a beforeEach
    // moving to a before() fixed them
    incomingWebhooks = proxyquire('../../mocker/incoming-webhooks', {
      '../lib/logger': loggerMock
    })
  })

  beforeEach(function () {
    loggerMock.error.reset()
    loggerMock.info.reset()
    loggerMock.debug.reset()

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

    it('should register a url with default response', function (done) {
      sendToUrl(url, {}, beforeRegister)

      function beforeRegister (err) {
        expect(err).to.exist

        incomingWebhooks.register(url)
        sendToUrl(url, {}, afterRegister)
      }

      function afterRegister (err, res, body) {
        expect(err).not.to.exist

        // default response
        expect(res.statusCode).to.equal(200)
        expect(body.ok).to.be.true
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

    it('should add a custom response', function (done) {
      incomingWebhooks.addResponse({
        url: url,
        statusCode: 500,
        body: {not: 'ok'},
        headers: {walter: 'white'}
      })

      sendToUrl(url, {}, (err, res, body) => {
        if (err) return done(err)

        expect(res.statusCode).to.equal(500)
        expect(body).to.deep.equal({not: 'ok'})
        expect(res.headers.walter).to.equal('white')
        done()
      })
    })

    it('should set default status', function (done) {
      incomingWebhooks.addResponse({
        url: url,
        body: {maybe: 'ok'},
        headers: {walter: 'white'}
      })

      sendToUrl(url, {}, (err, res, body) => {
        if (err) return done(err)
        expect(res.statusCode).to.equal(200)
        expect(body).to.deep.equal({maybe: 'ok'})
        done()
      })
    })

    it('should set default body', function (done) {
      incomingWebhooks.addResponse({
        url: url,
        statusCode: 500,
        headers: {walter: 'white'}
      })

      sendToUrl(url, {}, (err, res, body) => {
        if (err) return done(err)
        expect(res.statusCode).to.equal(500)
        expect(body).to.deep.equal({ok: true})
        done()
      })
    })

    it('should set default headers', function (done) {
      incomingWebhooks.addResponse({
        url: url,
        statusCode: 500,
        body: {maybe: 'ok'}
      })

      sendToUrl(url, {}, (err, res, body) => {
        if (err) return done(err)
        expect(res.statusCode).to.equal(500)
        expect(body).to.deep.equal({maybe: 'ok'})
        expect(res.headers).to.be.defined

        done()
      })
    })

    it('should queue requests', function (done) {
      incomingWebhooks.addResponse({
        url: url,
        statusCode: 201
      })

      incomingWebhooks.addResponse({
        url: url,
        statusCode: 202
      })

      sendToUrl(url, {}, (err, res) => {
        if (err) return done(err)
        expect(res.statusCode).to.equal(201)

        sendToUrl(url, {}, queuedCall)
      })

      function queuedCall (err, res) {
        if (err) return done(err)
        expect(res.statusCode).to.equal(202)

        sendToUrl(url, {}, defaultCall)
      }

      function defaultCall (err, res) {
        if (err) return done(err)
        expect(res.statusCode).to.equal(200)
        done()
      }
    })

    it('should add a request after a reset', function (done) {
      incomingWebhooks.addResponse({
        url: url,
        statusCode: 201
      })

      incomingWebhooks.reset()

      incomingWebhooks.addResponse({
        url: url,
        statusCode: 202
      })

      sendToUrl(url, {}, (err, res) => {
        if (err) return done(err)
        expect(res.statusCode).to.equal(202)
        done()
      })
    })

    it('should add a request after flushing request queue', function (done) {
      incomingWebhooks.addResponse({
        url: url,
        statusCode: 201
      })

      sendToUrl(url, {}, (err, res) => {
        if (err) return done(err)
        expect(res.statusCode).to.equal(201)

        sendToUrl(url, {}, emptyQueue)
      })

      function emptyQueue (err, res) {
        if (err) return done(err)
        expect(res.statusCode).to.equal(200)

        incomingWebhooks.addResponse({
          url: url,
          statusCode: 202
        })

        sendToUrl(url, {}, queuedResponse)
      }

      function queuedResponse (err, res) {
        if (err) return done(err)
        expect(res.statusCode).to.equal(202)
        done()
      }
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
        expect(incomingWebhooks.calls).to.have.length(1)

        const firstCall = incomingWebhooks.calls[0]
        expect(firstCall).to.have.keys(['url', 'body', 'headers'])
        expect(firstCall.url).to.equal(url)
        expect(firstCall.body).to.deep.equal({walter: 'white'})
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
        expect(incomingWebhooks.calls).to.have.length(1)
        const firstCall = incomingWebhooks.calls[0]
        expect(firstCall.body).to.deep.equal({walter: 'white'})

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

    it('should reset queued responses', function (done) {
      incomingWebhooks.addResponse({
        url: url,
        statusCode: 500,
        body: {not: 'ok'}
      })

      incomingWebhooks.reset()
      sendToUrl(url, {}, (err, res, body) => {
        if (err) return done(err)

        expect(res.statusCode).to.equal(200)
        expect(body).to.deep.equal({ok: true})

        done()
      })
    })
  })
})
