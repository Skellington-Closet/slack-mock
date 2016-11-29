'use strict'

const chai = require('chai')
const expect = chai.expect
const sinon = require('sinon')
const proxyquire = require('proxyquire').noCallThru()
const request = require('request')

chai.use(require('sinon-chai'))

describe('mocker: web', function () {
  let rtmMock
  let loggerMock
  let utilsMock
  let customResponsesMock
  let web

  before(function () {
    loggerMock = {
      error: sinon.stub(),
      info: sinon.stub(),
      debug: sinon.stub()
    }

    utilsMock = {
      parseParams: sinon.stub()
    }

    rtmMock = {
      _: {
        url: 'https://rtm.slack-mock'
      }
    }

    customResponsesMock = {
      get: sinon.stub(),
      reset: sinon.stub(),
      set: sinon.stub()
    }

    web = proxyquire('../../mocker/web', {
      './rtm': rtmMock,
      '../lib/custom-responses': customResponsesMock,
      '../lib/logger': loggerMock,
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
    customResponsesMock.reset.reset()
    customResponsesMock.set.reset()

    customResponsesMock.get.returns([200, {ok: true}, {}])

    web.reset()
  })

  describe('addResponse', function () {
    it('should call customResponses.set', function () {
      const opts = {}
      web.addResponse({})
      expect(customResponsesMock.set).to.have.been.calledWith('web', opts)
    })

    it('should add the rtm url to rtm.start response', function (done) {
      request({
        uri: 'https://slack.com/api/rtm.start',
        method: 'POST',
        json: true,
        body: {
          team: 'not.real'
        }
      }, afterPost)

      function afterPost (err, res, body) {
        if (err) return done(err)

        expect(body).to.deep.equal({
          ok: true,
          url: 'https://rtm.slack-mock'
        })
        done()
      }
    })
  })

  describe('calls', function () {
    it('should intercept POST API calls', function (done) {
      request({
        uri: 'https://slack.com/api/users.list',
        method: 'POST',
        json: true,
        body: {
          team: 'not.real'
        },
        qs: {
          token: 'abc'
        }
      }, afterPost)

      function afterPost (err, res, body) {
        if (err) return done(err)

        expect(res.statusCode).to.equal(200)
        expect(utilsMock.parseParams).to.have.been.calledWith('/api/users.list?token=abc', {team: 'not.real'})

        expect(web.calls).to.have.length(1)

        const firstCall = web.calls[0]
        expect(firstCall).to.have.keys(['url', 'body', 'headers'])
        expect(firstCall.url).to.equal('https://slack.com/api/users.list')
        expect(firstCall.body).to.deep.equal({parsed: 'body'})

        done()
      }
    })

    it('should intercept application/x-www-form-urlencoded calls', function (done) {
      request({
        uri: 'https://slack.com/api/users.list',
        method: 'POST',
        form: {
          team: 'not.real'
        },
        qs: {
          token: 'abc'
        }
      }, afterPost)

      function afterPost () {
        expect(web.calls).to.have.length(1)
        expect(utilsMock.parseParams).to.have.been.calledWith('/api/users.list?token=abc', 'team=not.real')

        const firstCall = web.calls[0]
        expect(firstCall).to.have.keys(['url', 'body', 'headers'])
        expect(firstCall.url).to.equal('https://slack.com/api/users.list')
        expect(firstCall.body).to.deep.equal({parsed: 'body'})

        done()
      }
    })

    it('should intercept GET API calls', function (done) {
      request({
        uri: 'https://slack.com/api/users.list',
        method: 'GET',
        json: true,
        qs: {
          team: 'not.real'
        }
      }, afterGet)

      function afterGet (err, res, body) {
        if (err) return done(err)

        expect(web.calls).to.have.length(1)
        expect(utilsMock.parseParams).to.have.been.calledWith('/api/users.list?team=not.real', '')

        const firstCall = web.calls[0]
        expect(firstCall).to.have.keys(['url', 'body', 'headers'])
        expect(firstCall.url).to.equal('https://slack.com/api/users.list')
        expect(firstCall.body).to.deep.equal({parsed: 'body'})

        done()
      }
    })

    it('should intercept POST OAuth authorize calls', function (done) {
      request({
        uri: 'https://slack.com/oauth/authorize',
        method: 'POST',
        json: true,
        body: {
          team: 'not.real'
        }
      }, afterPost)

      function afterPost () {
        expect(utilsMock.parseParams).to.have.been.calledWith('/oauth/authorize', {team: 'not.real'})

        expect(web.calls).to.have.length(1)

        const firstCall = web.calls[0]
        expect(firstCall).to.have.keys(['url', 'body', 'headers'])
        expect(firstCall.url).to.equal('https://slack.com/oauth/authorize')
        expect(firstCall.body).to.deep.equal({parsed: 'body'})

        done()
      }
    })

    it('should intercept GET OAuth authorize calls', function (done) {
      request({
        uri: 'https://slack.com/oauth/authorize',
        method: 'GET',
        qs: {
          team: 'not.real'
        }
      }, afterPost)

      function afterPost () {
        expect(utilsMock.parseParams).to.have.been.calledWith('/oauth/authorize?team=not.real')

        expect(web.calls).to.have.length(1)

        const firstCall = web.calls[0]
        expect(firstCall).to.have.keys(['url', 'body', 'headers'])
        expect(firstCall.url).to.equal('https://slack.com/oauth/authorize')
        expect(firstCall.body).to.deep.equal({parsed: 'body'})

        done()
      }
    })
  })

  describe('reset', function () {
    it('should reset calls', function (done) {
      request({
        uri: 'https://slack.com/api/users.list',
        method: 'POST',
        json: true,
        body: {
          team: 'not.real'
        }
      }, afterPost)

      function afterPost () {
        expect(web.calls).to.have.length(1)

        web.reset()
        expect(web.calls).to.have.length(0)
        done()
      }
    })

    it('should clear custom responses', function () {
      web.reset()
      expect(customResponsesMock.reset).to.have.been.calledWith('web')
    })
  })
})
