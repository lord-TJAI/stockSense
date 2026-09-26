'use strict';

const winston = require('winston');
const env = require('./env');

const logger = winston.createLogger({
  level: env.isProduction() ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    env.isProduction()
      ? winston.format.json()
      : winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, ...meta }) => {
            const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
            return `${timestamp} [${level}]: ${message}${metaStr}`;
          })
        )
  ),
  transports: [new winston.transports.Console()],
});

module.exports = logger;
