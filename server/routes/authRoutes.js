import express from 'express';
import { body } from 'express-validator';
import { register, login, getMe } from '../controllers/authController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

// Validation chains for registering a user
const registerValidationRules = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .trim(),
  body('email')
    .isEmail()
    .withMessage('Please include a valid email address')
    .trim(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
];

// Validation chains for logging in a user
const loginValidationRules = [
  body('email')
    .isEmail()
    .withMessage('Please include a valid email address')
    .trim(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Routes mapping
router.post('/register', registerValidationRules, register);
router.post('/login', loginValidationRules, login);
router.get('/me', protect, getMe);

export default router;
