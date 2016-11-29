'use strict'

const chai = require('chai')
const expect = chai.expect
const sinon = require('sinon')
const proxyquire = require('proxyquire').noCallThru()

chai.use(require('sinon-chai'))

describe('utils', function () {
  let qsMock
  let utils

  before(function () {
    qsMock = {
      parse: sinon.stub()
    }

    utils = proxyquire('../../lib/utils', {
      'qs': qsMock
    })
  })

  beforeEach(function () {
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
