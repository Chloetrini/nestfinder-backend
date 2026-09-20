import mongoose from 'mongoose'
import { connectDB } from '../src/config/database.js'
import logger from '../src/config/logger.js'
import Property from '../src/models/property.model.js'

// One-off cleanup: removes repeated image URLs from every property (keeps the first
// occurrence, so photo order is unchanged). Old edits used to append duplicates.
//
//   npm run dedupe:images            -> shows what would change (no writes)
//   npm run dedupe:images -- --apply -> saves the changes
const apply = process.argv.includes('--apply')

const run = async () => {
  try {
    await connectDB()
    const properties = await Property.find().select('propertyName images').lean()

    let changed = 0
    let removed = 0

    for (const property of properties) {
      const unique = [...new Set(property.images)]
      const extra = property.images.length - unique.length
      if (extra === 0) continue

      changed++
      removed += extra
      logger.info(`${property.propertyName}: ${property.images.length} -> ${unique.length} images`)

      if (apply) await Property.updateOne({ _id: property._id }, { $set: { images: unique } })
    }

    logger.info(
      apply
        ? `Done. Cleaned ${changed} properties, removed ${removed} duplicate URLs.`
        : `Dry run: ${changed} properties would lose ${removed} duplicate URLs. Run again with --apply to save.`
    )
    await mongoose.disconnect()
    process.exit(0)
  } catch (error) {
    logger.error({ err: error }, 'Cleanup failed')
    process.exit(1)
  }
}

void run()
