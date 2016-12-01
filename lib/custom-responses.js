'use strict'

const customResponses = module.exports
const logger = require('./logger')
const allResponses = new Map()

allResponses.set('incoming-webhooks', new Map())
allResponses.set('interactive-buttons', new Map())
allResponses.set('slash-commands', new Map())
allResponses.set('web', new Map())

customResponses.set = function (type, opts) {
  const typeResponses = allResponses.get(type)
  let urlResponses = typeResponses.get(opts.url)

  if (!urlResponses) {
    urlResponses = []
    typeResponses.set(opts.url, urlResponses)
  }

  logger.debug(`added response for ${type}`, opts)

  urlResponses.push({
    statusCode: opts.statusCode || 200,
    body: opts.body || (type === 'web' ? {ok: true} : 'OK'),
    headers: opts.headers || {}
  })
}

customResponses.get = function (type, url) {
  const defaultResponse = {statusCode: 200, body: 'OK', headers: {}}

  if (type === 'web') {
    defaultResponse.body = {ok: true}
  }

  const urlResponses = allResponses.get(type).get(url)
  let response = defaultResponse

  if (urlResponses && urlResponses.length) {
    response = urlResponses.shift()
    logger.debug(`responding to ${type} with override`, response)
  }

  return [
    response.statusCode,
    response.body,
    response.headers
  ]
}

customResponses.reset = function (type) {
  logger.debug(`clearing responses for ${type}`)
  allResponses.get(type).clear()
}

customResponses.resetAll = function () {
  for (let key of allResponses.keys()) {
    logger.debug(`clearing responses for ${key}`)
    allResponses.get(key).clear()
  }
}
