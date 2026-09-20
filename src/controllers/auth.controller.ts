import type { Request, Response } from 'express'
import { env } from '../config/keys.js'
import logger from '../config/logger.js'
import User from '../models/user.model.js'
import Property from '../models/property.model.js'
import { passwordResetEmailTemplate, verificationEmailTemplate, welcomeEmailTemplate } from '../services/email/email-templates.js'
import { sendEmail } from '../services/email/send-email.js'
import { AppError } from '../utils/app-error.js'
import tryCatchWrapper from '../utils/try-catch-wrapper.js'
import { sendSuccess } from '../utils/response-handler.js'
import { generateJWT, generateRandomToken, hashToken } from '../utils/tokens.js'

const publicUser = (user: { _id: unknown; name: string; email: string; role: string }) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
})

const percentChange = (current: number, previous: number): number =>
  previous === 0 ? (current > 0 ? 100 : 0) : Math.round(((current - previous) / previous) * 100)

// POST /api/auth/register
export const register = tryCatchWrapper(async (req: Request, res: Response) => {
  const { name, email, password } = req.body

  if (await User.exists({ email })) throw new AppError('Email is already registered', 400)

  const rawToken = generateRandomToken()

  const user = await User.create({
    name,
    email,
    password, // hashed in the User model
    emailVerifyToken: hashToken(rawToken),
    emailVerifyExpire: new Date(Date.now() + Number(env.EMAIL_VERIFY_TOKEN_EXPIRE || 86400000)),
  })

  const verifyUrl = `${env.CLIENT_URL}/verify-email?token=${rawToken}`
  const { subject, html } = verificationEmailTemplate(user.name, verifyUrl)

  try {
    await sendEmail({ to: user.email, subject, html })
  } catch (error) {
    // Don't leave an account nobody can verify: remove it so they can try again
    await User.deleteOne({ _id: user._id })
    logger.error({ err: error }, 'Verification email failed')
    throw new AppError('We could not send the verification email. Please try again.', 502)
  }

  sendSuccess(res, 201, { message: 'Account created! Please check your email to verify your account.' })
})

// GET /api/auth/verify-email/:token

export const verifyEmail = tryCatchWrapper(async (req: Request, res: Response) => {
  const token = String(req.params.token)

  const user = await User.findOne({
    emailVerifyToken: hashToken(token),
    emailVerifyExpire: { $gt: new Date() },
  })
  if (!user) throw new AppError('Invalid or expired verification link', 400)

  user.isVerified = true
  user.emailVerifyToken = undefined
  user.emailVerifyExpire = undefined
  await user.save()

  // Welcome email is a nice-to-have: send it in the background
  const { subject, html } = welcomeEmailTemplate(user.name)
  sendEmail({ to: user.email, subject, html }).catch(error => logger.error({ err: error }, 'Welcome email failed'))

  sendSuccess(res, 200, { message: 'Email verified successfully! you can log in' })
})

// POST /api/auth/login

export const login = tryCatchWrapper(async (req: Request, res: Response) => {
  const { email, password } = req.body

  const user = await User.findOne({ email }).select('+password')
  if (!user) throw new AppError('Invalid email or password', 401)

  if (!user.isVerified) throw new AppError('Please verify your email before logging in. Check your inbox', 401)

  if (!(await user.comparePassword(password))) throw new AppError('Invalid email or password', 401)

  sendSuccess(res, 200, {
    message: 'Login successful',
    token: generateJWT(user._id.toString(), user.role),
    user: publicUser(user),
  })
})

// POST /api/auth/forgot-password

export const forgotPassword = tryCatchWrapper(async (req: Request, res: Response) => {
  const { email } = req.body

  const user = await User.findOne({ email })

  // Same answer whether or not the account exists (don't leak who is registered)
  if (!user) {
    sendSuccess(res, 200, { message: 'If that email is registered, you will receive a reset link shortly.' })
    return
  }

  const rawToken = generateRandomToken()
  user.resetPasswordToken = hashToken(rawToken)
  user.resetPasswordExpire = new Date(Date.now() + Number(env.RESET_TOKEN_EXPIRE || 3600000))
  await user.save()

  const resetUrl = `${env.CLIENT_URL}/resetpassword?token=${rawToken}`
  const { subject, html } = passwordResetEmailTemplate(user.name, resetUrl)

  try {
    await sendEmail({ to: user.email, subject, html })
  } catch (error) {
    logger.error({ err: error }, 'Password reset email failed')
    throw new AppError('We could not send the reset email. Please try again.', 502)
  }

  sendSuccess(res, 200, { message: 'Password reset link sent to your email.' })
})

// POST /api/auth/reset-password/:token

export const resetpassword = tryCatchWrapper(async (req: Request, res: Response) => {
  const token = String(req.params.token)

  const user = await User.findOne({
    resetPasswordToken: hashToken(token),
    resetPasswordExpire: { $gt: new Date() },
  })
  if (!user) throw new AppError('Invalid or expired reset link. please request another one', 400)

  user.password = req.body.password
  user.resetPasswordToken = undefined
  user.resetPasswordExpire = undefined
  await user.save()

  sendSuccess(res, 200, { message: 'Password reset successful! You can login now' })
})

// GET /api/auth/me

export const getMe = tryCatchWrapper(async (req: Request, res: Response) => {
  const user = await User.findById(req.user?.id).lean()
  if (!user) throw new AppError('User not found', 404)

  sendSuccess(res, 200, { user: publicUser(user) })
})

// GET /api/auth/users/count  (admin)

export const getUsersCount = tryCatchWrapper(async (_req: Request, res: Response) => {
  const now = new Date()
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [count, lastMonthCount] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ createdAt: { $lt: startOfThisMonth } }),
  ])

  sendSuccess(res, 200, { count, percent: percentChange(count, lastMonthCount) })
})

// GET /api/auth/users/count/all  (admin)

export const getAllUsers = tryCatchWrapper(async (_req: Request, res: Response) => {
  const users = await User.find()
    .select('-emailVerifyToken -emailVerifyExpire -resetPasswordToken -resetPasswordExpire')
    .sort({ createdAt: -1 })
    .lean()

  sendSuccess(res, 200, { users })
})

// DELETE /api/auth/delete/:id  (admin)

export const deleteUser = tryCatchWrapper(async (req: Request, res: Response) => {
  const user = await User.findByIdAndDelete(req.params.id)
  if (!user) throw new AppError('User not found', 404)

  sendSuccess(res, 200, { message: 'User deleted successfully' })
})

// GET /api/auth/stats  (admin) — dashboard numbers, each compared with last month

export const getDashboardStats = tryCatchWrapper(async (_req: Request, res: Response) => {
  const now = new Date()
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const before = { createdAt: { $lt: startOfThisMonth } }

  const [total, lastMonthTotal, active, lastMonthActive, pending, lastMonthPending] = await Promise.all([
    Property.countDocuments(),
    Property.countDocuments(before),
    Property.countDocuments({ isDraft: false }),
    Property.countDocuments({ isDraft: false, ...before }),
    Property.countDocuments({ isDraft: true }),
    Property.countDocuments({ isDraft: true, ...before }),
  ])

  sendSuccess(res, 200, {
    stats: {
      totalProperties: { count: total, percent: percentChange(total, lastMonthTotal) },
      activeListings: { count: active, percent: percentChange(active, lastMonthActive) },
      pendingProperties: { count: pending, percent: percentChange(pending, lastMonthPending) },
    },
  })
})
