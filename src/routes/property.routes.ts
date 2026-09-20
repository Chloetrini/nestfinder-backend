import { Router } from 'express'
import {
  createProperty,
  deleteProperty,
  getAllPropertiesAdmin,
  getProperties,
  getProperty,
  setFeatured,
  updateProperty,
} from '../controllers/property.controller.js'
import { adminOnly, protect } from '../middlewares/auth.middleware.js'
import { cacheMiddleware } from '../middlewares/cache.middleware.js'
import { validateBody } from '../middlewares/schema.middleware.js'
import { featuredSchema } from '../validators/property.schema.js'

const router = Router()

// Public and cached for 60s (cache is cleared on every create/update/delete)
router.get('/', cacheMiddleware('properties', 60), getProperties)

// Admin (includes drafts, never cached). Declared before '/:id' for clarity.
router.get('/admin/all', protect, adminOnly, getAllPropertiesAdmin)

router.get('/:id', cacheMiddleware('properties', 60), getProperty)

router.post('/', protect, adminOnly, createProperty)
router.put('/:id', protect, adminOnly, updateProperty)
router.patch('/:id/featured', protect, adminOnly, validateBody(featuredSchema), setFeatured)
router.delete('/:id', protect, adminOnly, deleteProperty)

export default router
