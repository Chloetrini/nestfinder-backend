import type { Request, Response } from 'express'
import type { UploadedFile } from 'express-fileupload'
import Property from '../models/property.model.js'
import { invalidateCache } from '../services/cache.service.js'
import { parseStringArray, toBool, toNumber, uploadPropertyImages } from '../services/property.service.js'
import { AppError } from '../utils/app-error.js'
import tryCatchWrapper from '../utils/try-catch-wrapper.js'
import { sendSuccess } from '../utils/response-handler.js'

const CACHE_NAMESPACE = 'properties'

const imageFiles = (req: Request) => req.files?.images as UploadedFile | UploadedFile[] | undefined

// GET /api/properties  (public, cached)
export const getProperties = tryCatchWrapper(async (_req: Request, res: Response) => {
  const properties = await Property.find({ isDraft: false }).sort({ createdAt: -1 }).lean()
  sendSuccess(res, 200, { count: properties.length, properties })
})

// GET /api/properties/admin/all  (admin, includes drafts, never cached)

export const getAllPropertiesAdmin = tryCatchWrapper(async (_req: Request, res: Response) => {
  const properties = await Property.find().sort({ createdAt: -1 }).lean()
  sendSuccess(res, 200, { count: properties.length, properties })
})

// GET /api/properties/:id  (public, cached)

export const getProperty = tryCatchWrapper(async (req: Request, res: Response) => {
  const property = await Property.findById(req.params.id).lean()
  if (!property) throw new AppError('Property not found', 404)

  sendSuccess(res, 200, { property })
})

// POST /api/properties  (admin)

export const createProperty = tryCatchWrapper(async (req: Request, res: Response) => {
  const body = req.body

  if (!body.propertyName) throw new AppError('Property name is required', 400)
  if (await Property.exists({ propertyName: body.propertyName })) throw new AppError('Title already exists', 400)

  const images = await uploadPropertyImages(imageFiles(req))
  const isDraft = toBool(body.isDraft)

  const property = await Property.create({
    propertyName: body.propertyName,
    price: toNumber(body.price),
    propertyDescription: body.propertyDescription,
    propertyType: body.propertyType,
    sale: body.sale,
    location: { city: body.city, state: body.state, fullAddress: body.fullAddress },
    propertyDetails: {
      bedrooms: toNumber(body.bedrooms),
      bathroom: toNumber(body.bathroom),
      size: toNumber(body.size),
    },
    coordinates: { longitude: toNumber(body.longitude), latitude: toNumber(body.latitude) },
    images,
    amenities: parseStringArray(body.amenities),
    isFeatured: toBool(body.isFeatured),
    isDraft,
    agentName: body.agentName || 'NestFinder Agent',
    agentPhone: body.agentPhone || '+234 800 000 0000',
    discount: body.discount || '',
    createdBy: req.user?.id,
  })

  await invalidateCache(CACHE_NAMESPACE)

  sendSuccess(res, 201, {
    message: isDraft ? 'Property saved to drafts' : 'Property published successfully',
    property,
  })
})

// PUT /api/properties/:id  (admin)

export const updateProperty = tryCatchWrapper(async (req: Request, res: Response) => {
  const property = await Property.findById(req.params.id).select('images amenities').lean()
  if (!property) throw new AppError('Property not found', 404)

  const body = req.body

  // Images the admin kept (sent as JSON) + any newly uploaded ones
  const keptImages = body.existingImages === undefined ? property.images : parseStringArray(body.existingImages, property.images)
  const newImages = await uploadPropertyImages(imageFiles(req))

  // Only touch the fields that were actually sent
  const update: Record<string, unknown> = {
    images: [...keptImages, ...newImages],
    amenities: body.amenities ? parseStringArray(body.amenities, property.amenities) : property.amenities,
  }

  const plain = ['propertyName', 'propertyDescription', 'propertyType', 'sale', 'agentName', 'agentPhone', 'discount'] as const
  for (const key of plain) if (body[key] !== undefined) update[key] = body[key]

  if (body.price !== undefined) update.price = toNumber(body.price)
  if (body.isFeatured !== undefined) update.isFeatured = toBool(body.isFeatured)
  if (body.isDraft !== undefined) update.isDraft = toBool(body.isDraft)

  if (body.city !== undefined) update['location.city'] = body.city
  if (body.state !== undefined) update['location.state'] = body.state
  if (body.fullAddress !== undefined) update['location.fullAddress'] = body.fullAddress

  if (body.bedrooms !== undefined) update['propertyDetails.bedrooms'] = toNumber(body.bedrooms)
  if (body.bathroom !== undefined) update['propertyDetails.bathroom'] = toNumber(body.bathroom)
  if (body.size !== undefined) update['propertyDetails.size'] = toNumber(body.size)

  if (body.longitude !== undefined) update['coordinates.longitude'] = toNumber(body.longitude)
  if (body.latitude !== undefined) update['coordinates.latitude'] = toNumber(body.latitude)

  const updated = await Property.findByIdAndUpdate(req.params.id, { $set: update }, { returnDocument: 'after', runValidators: true }).lean()

  await invalidateCache(CACHE_NAMESPACE)

  sendSuccess(res, 200, { message: 'Property updated successfully', property: updated })
})

// DELETE /api/properties/:id  (admin)

export const deleteProperty = tryCatchWrapper(async (req: Request, res: Response) => {
  const property = await Property.findByIdAndDelete(req.params.id)
  if (!property) throw new AppError('Property not found', 404)

  await invalidateCache(CACHE_NAMESPACE)

  sendSuccess(res, 200, { message: 'Property deleted successfully' })
})

// PATCH /api/properties/:id/featured  (admin): pin or unpin a property on the home page
export const setFeatured = tryCatchWrapper(async (req: Request, res: Response) => {
  const property = await Property.findByIdAndUpdate(req.params.id, { isFeatured: req.body.isFeatured }, { returnDocument: 'after' }).lean()
  if (!property) throw new AppError('Property not found', 404)

  await invalidateCache(CACHE_NAMESPACE)
  sendSuccess(res, 200, {
    message: property.isFeatured ? 'Property is now featured' : 'Property removed from featured',
    property,
  })
})
