// 'use strict'
//
// const chai = require('chai')
// const expect = chai.expect
// const sinon = require('sinon')
// const proxyquire = require('proxyquire').noCallThru()
//
// chai.use(require('sinon-chai'))
//
// describe('mocker: web', function () {
//   let rtmMock
//   let resMock
//   let headersMock
//   let bodyMock
//   let loggerMock
//   let slashCommands
//   let target
//   let data
//
//   before(function () {
//     loggerMock = {
//       error: sinon.stub(),
//       info: sinon.stub(),
//       debug: sinon.stub()
//     }
//
//     rtmMock = {
//       _: {
//         url: 'https://rtm.slack-mock'
//       }
//     }
//
//     slashCommands = proxyquire('../../mocker/slash-commands', {
//       './rtm': rtmMock,
//       '../lib/logger': loggerMock
//     })
//   })
//
//   beforeEach(function () {
//     target = 'http://gus.fring'
//     data = {ding: 'ding'}
//
//     loggerMock.error.reset()
//     loggerMock.info.reset()
//     loggerMock.debug.reset()
//
//     slashCommands.reset()
//   })
//
//   describe('addResponse and calls', function () {
//     beforeEach(function () {
//
//     })
//
//     it('should ', function () {
//
//     })
//   })
//
//   describe('reset', function () {
//     beforeEach(function () {
//
//     })
//
//     it('should reset calls', function () {
//
//     })
//
//     it('should clear custom responses', function () {
//
//     })
//   })
// })
