'use strict'

const chai = require('chai')
const expect = chai.expect
const sinon = require('sinon')
const proxyquire = require('proxyquire').noCallThru()

chai.use(require('sinon-chai'))

describe('custom responses', function () {
  let loggerMock
  let customResponses

  before(function () {
    loggerMock = {
      error: sinon.stub(),
      info: sinon.stub(),
      debug: sinon.stub()
    }

    customResponses = proxyquire('../../src/lib/custom-responses', {
      './logger': loggerMock
    })
  })

  beforeEach(function () {
    loggerMock.error.reset()
    loggerMock.info.reset()
    loggerMock.debug.reset()

    customResponses.resetAll()
  })

  describe('set', function () {
    it('should set a custom response with all options', function () {
      const opts = {
        url: 'set.walter.white',
        statusCode: 400,
        body: 'body',
        headers: 'headers'
      }

      customResponses.set('web', opts)

      expect(customResponses.get('web', 'set.walter.white')).to.deep.equal([400, 'body', 'headers'])
    })

    it('should set url of any if no url is passed', function () {
      const opts = {
        statusCode: 400,
        body: 'body',
        headers: 'headers'
      }

      customResponses.set('web', opts)

      expect(customResponses.get('web', 'set.walter.white')).to.deep.equal([400, 'body', 'headers'])
    })

    it('should use specific url over any', function () {
      it('should set url of any if no url is passed', function () {
        const opts = {
          statusCode: 401,
          body: 'body',
          headers: 'headers'
        }
        customResponses.set('web', opts)

        const opts2 = {
          url: 'set.walter.white',
          statusCode: 402,
          body: 'body',
          headers: 'headers'
        }
        customResponses.set('web', opts2)

        expect(customResponses.get('web', 'set.walter.white')).to.deep.equal([402, 'body', 'headers'])
      })
    })

    it('should default status code and headers', function () {
      const opts = {
        url: 'set.walter.white',
        body: 'body'
      }

      customResponses.set('web', opts)
      expect(customResponses.get('web', 'set.walter.white')).to.deep.equal([200, 'body', {}])
    })

    it('should default body to OK', function () {
      const opts = {
        url: 'set.walter.white',
        statusCode: 404
      }

      customResponses.set('incoming-webhooks', opts)
      expect(customResponses.get('incoming-webhooks', 'set.walter.white')[1]).to.equal('OK')
    })

    it('should default body to {ok: true} for type web', function () {
      const opts = {
        url: 'set.walter.white',
        statusCode: 404
      }

      customResponses.set('web', opts)
      expect(customResponses.get('web', 'set.walter.white')[1]).to.deep.equal({ok: true})
    })

    it('should queue multiple responses', function () {
      customResponses.set('web', {
        url: 'set.walter.white',
        statusCode: 201
      })

      customResponses.set('web', {
        url: 'set.walter.white',
        statusCode: 202
      })

      expect(customResponses.get('web', 'set.walter.white')[0]).to.equal(201)
      expect(customResponses.get('web', 'set.walter.white')[0]).to.equal(202)
    })

    it('should queue after draining the queue', function () {
      customResponses.set('web', {
        url: 'set.walter.white',
        statusCode: 201
      })

      customResponses.set('web', {
        url: 'set.walter.white',
        statusCode: 202
      })

      expect(customResponses.get('web', 'set.walter.white')[0]).to.equal(201)
      expect(customResponses.get('web', 'set.walter.white')[0]).to.equal(202)
      expect(customResponses.get('web', 'set.walter.white')[0]).to.equal(200)

      customResponses.set('web', {
        url: 'set.walter.white',
        statusCode: 203
      })
      expect(customResponses.get('web', 'set.walter.white')[0]).to.equal(203)
    })

    it('should queue after resetting the queue', function () {
      customResponses.set('web', {
        url: 'set.walter.white',
        statusCode: 201
      })

      customResponses.reset('web')

      customResponses.set('web', {
        url: 'set.walter.white',
        statusCode: 202
      })

      expect(customResponses.get('web', 'set.walter.white')[0]).to.equal(202)
    })
  })

  describe('get', function () {
    it('should get a default response', function () {
      expect(customResponses.get('incoming-webhooks', 'get.walter.white')).to.deep.equal([200, 'OK', {}])
    })

    it('should get a default response for type web', function () {
      expect(customResponses.get('web', 'get.walter.white')).to.deep.equal([200, {ok: true}, {}])
    })

    it('should get queued response', function () {
      customResponses.set('web', {
        url: 'get.walter.white',
        statusCode: 201
      })

      expect(customResponses.get('web', 'get.walter.white')[0]).to.equal(201)
    })

    it('should get default response after emptying queue', function () {
      customResponses.set('web', {
        url: 'get.walter.white',
        statusCode: 201
      })

      expect(customResponses.get('web', 'get.walter.white')[0]).to.equal(201)
      expect(customResponses.get('web', 'get.walter.white')[0]).to.equal(200)
    })
  })

  describe('reset', function () {
    it('should clear responses for a type', function () {
      customResponses.set('web', {
        url: 'reset.walter.white',
        statusCode: 201
      })

      customResponses.set('incoming-webhooks', {
        url: 'reset.walter.white',
        statusCode: 202
      })

      customResponses.reset('web')

      expect(customResponses.get('web', 'reset.walter.white')[0]).to.equal(200)
      expect(customResponses.get('incoming-webhooks', 'reset.walter.white')[0]).to.equal(202)
    })
  })

  describe('resetAll', function () {
    beforeEach(function () {

    })

    it('should clear responses for all types', function () {
      customResponses.set('web', {
        url: 'reset.walter.white',
        statusCode: 201
      })

      customResponses.set('incoming-webhooks', {
        url: 'reset.walter.white',
        statusCode: 202
      })

      customResponses.resetAll()

      expect(customResponses.get('web', 'reset.walter.white')[0]).to.equal(200)
      expect(customResponses.get('incoming-webhooks', 'reset.walter.white')[0]).to.equal(200)
    })
  })
})
