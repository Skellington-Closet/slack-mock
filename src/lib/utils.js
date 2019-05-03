'use strict'

const utils = module.exports
const qs = require('qs')
const logger = require('./logger')

utils.parseParams = function (path, requestBody) {
  let body = requestBody
  let queryString = {}
  const pathParts = path.split('?')

  if (pathParts[1]) {
    if (typeof requestBody === 'string') {
      // parses content-type application/x-www-form-urlencoded
      logger.debug(`parsing application/x-www-form-urlencoded body: ${requestBody}`)
      body = qs.parse(requestBody)
    }
    // query params from a GET request
    logger.debug(`parsing query parameters: ${pathParts[1]}`)
    queryString = qs.parse(`${pathParts[1]}`)
    Object.keys(queryString).forEach((key) => {
      body[key] = queryString[key]
    })
  } else if (typeof requestBody === 'string') {
    // parses content-type application/x-www-form-urlencoded
    logger.debug(`rendering body: ${requestBody}`)
    body = requestBody
  }

  return body
}
