'use strict'

const chai = require('chai')
const expect = chai.expect
const sinon = require('sinon')
const proxyquire = require('proxyquire').noCallThru()
const request = require('request')

chai.use(require('sinon-chai'))

describe('mocker: interactive buttons', function () {
  let requestMock
  let resMock
  let headersMock
  let bodyMock
  let loggerMock
  let interactiveButtons
  let target
  let data

  before(function () {
    loggerMock = {
      error: sinon.stub(),
      info: sinon.stub(),
      debug: sinon.stub()
    }

    requestMock = sinon.stub()

    interactiveButtons = proxyquire('../../mocker/interactive-buttons', {
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

    interactiveButtons.reset()
  })

  describe('send and calls', function () {
    it('should record a successful response', function () {
      return interactiveButtons.send(target, data)
        .then(() => {
          expect(interactiveButtons.calls).to.have.length(1)

          const firstCall = interactiveButtons.calls[0]
          expect(firstCall).to.have.keys(['url', 'body', 'headers', 'statusCode', 'type'])

          expect(firstCall.url).to.equal(target)
          expect(firstCall.body).to.equal(bodyMock)
          expect(firstCall.headers).to.equal(headersMock)
          expect(firstCall.statusCode).to.equal(resMock.statusCode)
          expect(firstCall.type).to.equal('response')
        })
    })

    it('should log an error if request fails', function () {
      const error = new Error('GUS')
      requestMock.yields(error)

      return interactiveButtons.send(target, data)
        .then(() => {
          expect(interactiveButtons.calls).to.have.length(0)
          expect(loggerMock.error).to.have.been.called
        })
    })

    it('should record a response_url request', function (done) {
      requestMock.yields(null, resMock, 'OK')
      interactiveButtons.send(target, data)

      const requestData = requestMock.args[0][0].form
      const postData = {
        jesse: 'pinkman'
      }

      request({
        method: 'POST',
        uri: requestData.response_url,
        json: true,
        body: postData
      }, whatHappened)

      function whatHappened (err, res, body) {
        if (err) return done(err)

        // one call for the immediate response, one for the delayed response_url request
        expect(interactiveButtons.calls).to.have.length(2)

        const secondCall = interactiveButtons.calls[1]

        expect(secondCall).to.have.keys(['url', 'body', 'headers', 'type'])

        expect(secondCall.url).to.equal(requestData.response_url)
        expect(secondCall.body).to.deep.equal(postData)
        expect(secondCall.type).to.equal('response_url')

        done()
      }
    })

    it('should record a response_url response of type application/x-www-form-urlencoded', function (done) {
      interactiveButtons.send(target, data)

      const requestData = requestMock.args[0][0].form
      const formData = {
        jesse: 'pinkman'
      }

      request({
        method: 'POST',
        uri: requestData.response_url,
        form: formData
      }, whatHappened)

      function whatHappened (err) {
        if (err) return done(err)

        // one call for the immediate response, one for the delayed response_url request
        expect(interactiveButtons.calls).to.have.length(2)
        const secondCall = interactiveButtons.calls[1]
        expect(secondCall.body).to.deep.equal(formData)
        done()
      }
    })
  })

  describe('reset', function () {
    it('should clear calls array', function () {
      return interactiveButtons.send(target, data)
        .then(() => {
          expect(interactiveButtons.calls).to.have.length(1)
          interactiveButtons.reset()
          expect(interactiveButtons.calls).to.have.length(0)
        })
    })
  })
})
