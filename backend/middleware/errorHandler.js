////middleware/errorHandler.js
/**
 * Global Error Handler Middleware
 * Standardizes error responses across the application.
 * Only handles errors that are not already caught at the controller level.
 */

const errorHandler = (err, req, res, next) => {
  console.error('[Global Error]', err.message || err);

  const status  = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(status).json({
    success: false,
    message
  });
};

module.exports = errorHandler;