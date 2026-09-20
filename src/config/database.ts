import mongoose, { ConnectOptions } from 'mongoose'
import { env } from './keys.js'
import logger, { logError } from './logger.js'

interface DBConnect {
  isConnected: boolean
  retryCount: number
  maxRetries: number
}

const dbConnection: DBConnect = { isConnected: false, retryCount: 0, maxRetries: 5 }

const connectionOptions: ConnectOptions = {
  serverSelectionTimeoutMS: 30000,
  retryReads: true,
  retryWrites: true,
  maxPoolSize: 20,
  minPoolSize: 2,
}

export const connectDB = async (): Promise<void> => {
  if (dbConnection.isConnected) {
    logger.info('Using existing MongoDB connection')
    return
  }

  if (dbConnection.retryCount >= dbConnection.maxRetries) {
    logger.error('Max MongoDB connection retries reached')
    process.exit(1)
  }

  try {
    const conn = await mongoose.connect(env.MONGODB_URI, connectionOptions)
    dbConnection.isConnected = conn.connections[0].readyState === 1
    dbConnection.retryCount = 0

    if (dbConnection.isConnected) {
      logger.info(`MongoDB connected: ${conn.connection.host}`)

      mongoose.connection.on('error', err => {
        logError(err, 'MongoDB connection error')
        dbConnection.isConnected = false
      })

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected')
        dbConnection.isConnected = false
        if (dbConnection.retryCount < dbConnection.maxRetries) {
          dbConnection.retryCount++
          logger.info(`Attempting to reconnect (${dbConnection.retryCount}/${dbConnection.maxRetries})`)
          setTimeout(connectDB, 5000)
        }
      })
    }
  } catch (error: unknown) {
    dbConnection.retryCount++
    logError(error, `MongoDB connection failed (attempt ${dbConnection.retryCount}/${dbConnection.maxRetries})`)

    if (dbConnection.retryCount < dbConnection.maxRetries) {
      logger.info('Retrying in 5 seconds...')
      setTimeout(connectDB, 5000)
    } else {
      logger.error('Max retries reached. Exiting...')
      process.exit(1)
    }
  }
}

export const gracefulShutDown = async (): Promise<void> => {
  try {
    logger.info('Received shutdown signal. Closing server...')
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close()
      logger.info('MongoDB connection closed')
    }
    process.exit(0)
  } catch (error) {
    logError(error, 'Error during shutdown')
    process.exit(1)
  }
}
