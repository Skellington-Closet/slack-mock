'use strict'

const chai = require('chai')
const expect = chai.expect
const sinon = require('sinon')
const proxyquire = require('proxyquire').noCallThru()

chai.use(require('sinon-chai'))

describe('utils', function () {
  let qsMock
  let loggerMock
  let utils

  before(function () {
    qsMock = {
      parse: sinon.stub()
    }

    loggerMock = {
      error: sinon.stub(),
      info: sinon.stub(),
      debug: sinon.stub()
    }

    utils = proxyquire('../../src/lib/utils', {
      './logger': loggerMock,
      'qs': qsMock
    })
  })

  beforeEach(function () {
    loggerMock.error.reset()
    loggerMock.info.reset()
    loggerMock.debug.reset()

    qsMock.parse.reset()
    qsMock.parse.returns({parsed: true})
  })

  describe('parseParams', function () {
    beforeEach(function () {

    })

    it('should return the body', function () {
      const result = utils.parseParams('/heisenberg', {walter: 'white'})
      expect(result).to.have.keys(['walter'])
      expect(result.walter).to.equal('white')
    })

    it('should merge query parameters with body', function () {
      const result = utils.parseParams('/heisenberg?the=one&who=knocks', {walter: 'white'})

      expect(qsMock.parse).to.have.been.calledWith('the=one&who=knocks')
      expect(result).to.have.keys(['walter', 'parsed'])
      expect(result.walter).to.equal('white')
      expect(result.parsed).to.be.true
    })

    it('should parse application/x-www-form-urlencoded body', function () {
      qsMock.parse.onCall(0).returns({first: true})
      qsMock.parse.onCall(1).returns({second: true})

      const result = utils.parseParams('/heisenberg?the=one&who=knocks', 'walter=white')

      expect(qsMock.parse).to.have.been.calledWith('the=one&who=knocks')
      expect(qsMock.parse).to.have.been.calledWith('walter=white')
      expect(result).to.deep.equal({first: true, second: true})
    })
  })
})
