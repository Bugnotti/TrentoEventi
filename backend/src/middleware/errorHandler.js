// Global error handler middleware
export const errorHandler = (err, req, res, next) => {
  console.error('🚨 Error caught by global handler:', err);

  // Default error
  let error = {
    message: 'Errore interno del server',
    statusCode: 500
  };

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    error.message = 'Dati di input non validi';
    error.statusCode = 400;
    error.details = Object.values(err.errors).map(val => ({
      field: val.path,
      message: val.message
    }));
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error.message = `${field} già esistente`;
    error.statusCode = 409;
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    error.message = 'ID non valido';
    error.statusCode = 400;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error.message = 'Token non valido';
    error.statusCode = 403;
  }

  if (err.name === 'TokenExpiredError') {
    error.message = 'Token scaduto';
    error.statusCode = 401;
  }

  // Rate limiting error
  if (err.statusCode === 429) {
    error.message = 'Troppi tentativi, riprova più tardi';
    error.statusCode = 429;
  }

  // Custom application errors
  if (err.statusCode) {
    error.statusCode = err.statusCode;
  }

  if (err.message) {
    error.message = err.message;
  }

  // Response
  const response = {
    error: error.message,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  };

  // Add details only in development or for specific error types
  if (process.env.NODE_ENV === 'development') {
    response.details = error.details || err.message;
    response.stack = err.stack;
  } else if (error.details) {
    // Include validation details in production for client-side handling
    response.details = error.details;
  }

  // Log security-related errors
  if (err.name === 'MongoError' && err.message.includes('injection')) {
    console.error('🚨 Potential injection attempt detected:', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method,
      body: req.body
    });
  }

  res.status(error.statusCode).json(response);
};

// 404 handler
export const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    error: 'Risorsa non trovata',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
};

// Async error wrapper
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
