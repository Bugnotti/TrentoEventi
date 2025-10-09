import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import compression from 'compression';

// Rate limiting configurations
export const createRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: message || 'Troppi tentativi, riprova più tardi',
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // Skip rate limiting for development with bypass header
      return process.env.NODE_ENV === 'development' && req.headers['x-dev-bypass'] === 'true';
    }
  });
};

// General API rate limiting (100 requests per 15 minutes)
export const generalLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  100, // 100 requests
  'Troppe richieste dall\'IP, riprova più tardi'
);

// Auth endpoints rate limiting (5 requests per 15 minutes)
export const authLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  5, // 5 requests
  'Troppi tentativi di autenticazione, riprova più tardi'
);

// Event creation rate limiting (10 requests per hour)
export const eventCreationLimiter = createRateLimit(
  60 * 60 * 1000, // 1 hour
  10, // 10 requests
  'Troppi eventi creati, riprova più tardi'
);

// Helmet security headers configuration
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false, // Disable for compatibility
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  }
});

// MongoDB injection protection
export const mongoSanitizeConfig = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.log(`🚨 MongoDB injection attempt blocked: ${key} in ${req.method} ${req.path}`);
  }
});

// HTTP Parameter Pollution protection
export const hppConfig = hpp();

// Compression middleware
export const compressionConfig = compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6, // Compression level (1-9)
  threshold: 1024 // Only compress responses larger than 1KB
});

// Request size limiting
export const requestSizeLimit = '10mb';

// Environment validation
export const validateEnvironment = () => {
  const requiredVars = ['JWT_SECRET', 'MONGO_URI'];
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    } else {
      console.warn('⚠️ Running in development mode with missing environment variables');
    }
  }
  
  // Warn about weak JWT secret in production
  if (process.env.NODE_ENV === 'production' && process.env.JWT_SECRET === 'dev_secret') {
    console.error('❌ CRITICAL: Using default JWT secret in production!');
    process.exit(1);
  }
};
