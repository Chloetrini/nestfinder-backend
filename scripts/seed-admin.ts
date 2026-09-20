import mongoose from 'mongoose'
import { connectDB } from '../src/config/database.js'
import { env } from '../src/config/keys.js'
import logger from '../src/config/logger.js'
import User from '../src/models/user.model.js'

// Creates the admin account (run once): npm run seed:admin
const seedAdmin = async () => {
  try {
    await connectDB()

    const adminEmail = (env.ADMIN_EMAIL || 'adloebrandd@gmail.com').toLowerCase()
    const adminPassword = env.ADMIN_PASSWORD || 'admin123'

    if (await User.exists({ email: adminEmail })) {
      logger.info('Admin user already exists')
    } else {
      const admin = await User.create({
        name: 'Admin',
        email: adminEmail,
        password: adminPassword, // hashed in the User model
        role: 'admin',
        isVerified: true, // admin does not need email verification
      })
      logger.info(`Admin created: ${admin.email} (role: ${admin.role}). You can now log in from the frontend.`)
    }
    await mongoose.disconnect()
    process.exit(0)
  } catch (error) {
    logger.error({ err: error }, 'Seeder error')
    process.exit(1)
  }
}

void seedAdmin()
