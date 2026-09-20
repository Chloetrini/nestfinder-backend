import compression from 'compression'
import cors from 'cors'
import express from 'express'
import fileUpload from 'express-fileupload'
import helmet from 'helmet'
import { connectDB, gracefulShutDown } from './config/database.js'
import { env } from './config/keys.js'
import logger from './config/logger.js'
import { appErrorHandler, createExpressLogger, notFoundRoutes, setupGlobalErrorHandlers } from './middlewares/error.middleware.js'
import { globalLimiter } from './middlewares/rate-limit.middleware.js'
import authRoutes from './routes/auth.routes.js'
import contactRoutes from './routes/contact.routes.js'
import enquiryRoutes from './routes/enquiry.routes.js'
import newsletterRoutes from './routes/newsletter.routes.js'
import propertyRoutes from './routes/property.routes.js'

setupGlobalErrorHandlers()

const app = express()

// Behind Render's proxy: needed for correct client IPs (rate limiting) and https
app.set('trust proxy', 1)

// ---------- middleware ----------
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.use(compression())
app.use(createExpressLogger())

const allowedOrigins = [
  env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'https://nestfinder-real-estate-ljlj.vercel.app',
  ...(env.CORS_ORIGINS ? env.CORS_ORIGINS.split(',').map(o => o.trim()).filter(Boolean) : []),
]

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
)

app.use(globalLimiter)
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true, limit: '1mb' }))

// Property images arrive as multipart uploads (kept in memory, sent to Cloudinary)
app.use(
  fileUpload({
    useTempFiles: false,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB per file
    abortOnLimit: true,
  })
)

// ---------- routes ----------
const healthHandler = (_req: express.Request, res: express.Response) => {
  res.status(200).json({ success: true, message: 'NestFinder Pro API is running' })
}
app.get('/api/health', healthHandler)
app.get('/health', healthHandler)

app.use('/api/auth', authRoutes)
app.use('/api/properties', propertyRoutes)
app.use('/api/enquiries', enquiryRoutes)
app.use('/api/contact', contactRoutes)
app.use('/api/newsletter', newsletterRoutes)

app.use(notFoundRoutes)
app.use(appErrorHandler)

// ---------- start ----------
const PORT = Number(env.PORT) || 7200

// Listen first so the host sees an open port right away; the database connects
// (and retries) in the background.
const start = () => {
  const server = app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT} (${env.NODE_ENV || 'development'})`)
  })

  const shutdown = () => {
    server.close(() => void gracefulShutDown())
  }
  process.on('SIGTERM', shutdown)
  process.on('SIGINT', shutdown)

  void connectDB()
}

start()

export default app
