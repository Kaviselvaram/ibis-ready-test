import { logger } from "../utils/logger.js";

export const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const meta = {
      requestId: req.requestId,
      method: req.method,
      route: req.originalUrl,
      userId: req.user ? req.user.sub : 'anonymous',
      statusCode: res.statusCode,
      executionTime: duration
    };

    if (duration > 1000) {
      logger.warn('Slow request detected', meta);
    } else if (res.statusCode >= 500) {
      logger.error('Server error response', meta);
    } else if (res.statusCode >= 400) {
      logger.warn('Client error response', meta);
    } else {
      logger.info('Request completed', meta);
    }
  });

  next();
};
