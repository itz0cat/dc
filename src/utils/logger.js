const { createLogger, format, transports } = require('winston');
const path = require('path');
const fs = require('fs');

const logsDir = path.join(__basedir, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom log formatting
const logFormat = format.printf((info) => {
  const { timestamp, level, label, message, ...rest } = info;
  let log = `${timestamp} - ${level} [${label}]: ${message}`;

  // Check if rest is an object
  if (!( Object.keys(rest).length === 0 && rest.constructor === Object )) {
    log = `${log}\n${JSON.stringify(rest, null, 2)}`.replace(/\\n/g, '\n');
  }
  return log;
});

const appName = process.mainModule ? path.basename(process.mainModule.filename) : 'app.js';

/**
 * Create a new logger
 * @type {Logger}
 */
const logger = createLogger({
  level: 'debug',
  format: format.combine(
    format.errors({ stack: true }),
    format.label({ label: appName }),
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' })
  ),
  transports: [ 
    // Logging to console
    new transports.Console({ 
      format: format.combine(
        format.colorize(),
        logFormat
      )
    }),
    // Logging info and up to file
    new transports.File({ 
      filename: path.join(__basedir, 'logs/full.log'), 
      level: 'info',
      format: logFormat,
      options: { flags: 'a' } 
    }),
    // Logging only warns and errors to file
    new transports.File({ 
      filename: path.join(__basedir, 'logs/error.log'),
      level: 'warn',
      format: logFormat,
      options: { flags: 'a' }
    })
  ]
});

module.exports = logger;