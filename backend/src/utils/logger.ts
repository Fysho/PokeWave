import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'pokewave-backend' },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, skipFormat, ...meta }) => {
          const msg = String(message);
          
          // For battle logs, use a simpler format
          if (skipFormat && msg.includes('won battle')) {
            return `${timestamp} [${level}]: ${msg}`;
          }
          
          // Remove 'service' from meta for cleaner output
          const { service, ...cleanMeta } = meta;
          
          return `${timestamp} [${level}]: ${msg} ${
            Object.keys(cleanMeta).length ? JSON.stringify(cleanMeta, null, 2) : ''
          }`;
        })
      )
    })
  ]
});

// If we're in production, add file transports
if (process.env.NODE_ENV === 'production') {
  logger.add(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error'
    })
  );
  logger.add(
    new winston.transports.File({
      filename: 'logs/combined.log'
    })
  );
}

export default logger;