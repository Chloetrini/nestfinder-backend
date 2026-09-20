import { Router } from 'express'
import {
  deleteUser,
  forgotPassword,
  getAllUsers,
  getDashboardStats,
  getMe,
  getUsersCount,
  login,
  register,
  resetpassword,
  verifyEmail,
} from '../controllers/auth.controller.js'
import { adminOnly, protect } from '../middlewares/auth.middleware.js'
import { authLimiter } from '../middlewares/rate-limit.middleware.js'
import { validateBody } from '../middlewares/schema.middleware.js'
import { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema } from '../validators/auth.schema.js'

const router = Router()

// Public
router.post('/register', authLimiter, validateBody(registerSchema), register)
router.get('/verify-email/:token', verifyEmail)
router.post('/login', authLimiter, validateBody(loginSchema), login)
router.post('/forgot-password', authLimiter, validateBody(forgotPasswordSchema), forgotPassword)
router.post('/reset-password/:token', authLimiter, validateBody(resetPasswordSchema), resetpassword)

// Logged in
router.get('/me', protect, getMe)

// Admin only
router.get('/users/count', protect, adminOnly, getUsersCount)
router.get('/users/count/all', protect, adminOnly, getAllUsers)
router.delete('/delete/:id', protect, adminOnly, deleteUser)
router.get('/stats', protect, adminOnly, getDashboardStats)

export default router
