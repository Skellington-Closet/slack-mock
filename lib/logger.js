'use strict'

const winston = require('winston')

// log levels: error, warn, info, verbose, debug, silly
module.exports = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({
      // handle logging uncaughtException
      handleExceptions: true,
      humanReadableUnhandledException: true,
      formatter: (options) => {
        let message = (options.message ? options.message : '')

        if (options.meta) {
          if (options.meta.stack) {
            message += `\n ${Array.isArray(options.meta.stack) ? options.meta.stack.join('\n') : options.meta.stack}`
          } else if (Object.keys(options.meta).length) {
            message += `\n${JSON.stringify(options.meta, null, 2)}`
          }
        }

        return `slack-mock ${options.level.toUpperCase()} ${message}`
      }
    })
  ]
})
