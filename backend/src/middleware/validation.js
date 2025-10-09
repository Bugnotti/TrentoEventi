import { body, param, validationResult } from 'express-validator';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

// Create DOMPurify instance for server-side sanitization
const window = new JSDOM('').window;
const purify = DOMPurify(window);

// Validation error handler
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Dati di input non validi',
      details: errors.array().map(err => ({
        field: err.path || err.param,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

// Input sanitization middleware
export const sanitizeInput = (req, res, next) => {
  const sanitizeObject = (obj) => {
    if (typeof obj === 'string') {
      return purify.sanitize(obj.trim());
    }
    if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeObject(value);
      }
      return sanitized;
    }
    return obj;
  };

  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }

  next();
};

// Event validation rules
export const validateEvent = [
  body('name')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Il nome dell\'evento deve essere tra 3 e 200 caratteri')
    .matches(/^[a-zA-Z0-9\s\-_.,!?()àèéìíîòóùú]+$/u)
    .withMessage('Il nome contiene caratteri non validi'),
  
  body('category')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('La categoria deve essere tra 2 e 50 caratteri')
    .matches(/^[a-zA-Z\s\/]+$/u)
    .withMessage('La categoria contiene caratteri non validi'),
  
  body('date')
    .isISO8601()
    .withMessage('Data non valida')
    .custom((value) => {
      const eventDate = new Date(value);
      const now = new Date();
      const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
      
      if (eventDate < now) {
        throw new Error('La data dell\'evento non può essere nel passato');
      }
      if (eventDate > oneYearFromNow) {
        throw new Error('La data dell\'evento non può essere più di un anno nel futuro');
      }
      return true;
    }),
  
  body('location')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('La location deve essere tra 3 e 200 caratteri')
    .matches(/^[a-zA-Z0-9\s\-_.,àèéìíîòóùú]+$/u)
    .withMessage('La location contiene caratteri non validi'),
  
  body('link')
    .optional()
    .isURL()
    .withMessage('Link non valido')
    .custom((value) => {
      if (value && !value.match(/^https:\/\/(www\.)?instagram\.com\//)) {
        throw new Error('Il link deve essere un URL Instagram valido');
      }
      return true;
    }),
  
  body('reporterInstagram')
    .optional()
    .trim()
    .matches(/^@?[a-zA-Z0-9._]+$/)
    .withMessage('Username Instagram non valido')
    .isLength({ max: 30 })
    .withMessage('Username Instagram troppo lungo')
];

// User registration validation
export const validateUserRegistration = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username deve essere tra 3 e 30 caratteri')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username può contenere solo lettere, numeri e underscore'),
  
  body('email')
    .isEmail()
    .withMessage('Email non valida')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password deve essere almeno 8 caratteri')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password deve contenere almeno una lettera minuscola, una maiuscola e un numero'),
  
  body('firstName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Nome troppo lungo')
    .matches(/^[a-zA-Zàèéìíîòóùú\s]+$/u)
    .withMessage('Nome contiene caratteri non validi'),
  
  body('lastName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Cognome troppo lungo')
    .matches(/^[a-zA-Zàèéìíîòóùú\s]+$/u)
    .withMessage('Cognome contiene caratteri non validi'),
  
  body('instagram.username')
    .optional()
    .trim()
    .matches(/^@?[a-zA-Z0-9._]+$/)
    .withMessage('Username Instagram non valido')
    .isLength({ max: 30 })
    .withMessage('Username Instagram troppo lungo')
];

// User login validation
export const validateUserLogin = [
  body('email')
    .isEmail()
    .withMessage('Email non valida')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password richiesta')
];

// ObjectId validation
export const validateObjectId = (paramName = 'id') => [
  param(paramName)
    .isMongoId()
    .withMessage(`${paramName} non valido`)
];

// Event modification validation
export const validateEventModification = [
  ...validateEvent,
  ...validateObjectId('eventId'),
  
  body('pendingModifications')
    .optional()
    .isObject()
    .withMessage('Modifiche non valide')
];

// Pagination validation
export const validatePagination = [
  body('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Numero pagina non valido'),
  
  body('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limite non valido (1-100)')
];

// Generic string validation
export const validateString = (fieldName, minLength = 1, maxLength = 255) => [
  body(fieldName)
    .trim()
    .isLength({ min: minLength, max: maxLength })
    .withMessage(`${fieldName} deve essere tra ${minLength} e ${maxLength} caratteri`)
    .matches(/^[a-zA-Z0-9\s\-_.,!?()àèéìíîòóùú]+$/u)
    .withMessage(`${fieldName} contiene caratteri non validi`)
];
