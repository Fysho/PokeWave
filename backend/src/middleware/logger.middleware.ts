import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export const loggerMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();

  // Log request
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip
  });

  // Capture the original send method
  const originalSend = res.send;

  // Override send method to log response
  res.send = function (data: any): Response {
    const duration = Date.now() - start;
    
    logger.info('Outgoing response', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`
    });

    // Call the original send method
    return originalSend.call(this, data);
  };

  next();
};