import type { UploadedFile } from 'express-fileupload'
import cloudinary from '../config/cloudinary.js'

// ---------- form parsing ----------
// Property forms are sent as multipart/form-data, so numbers/booleans/arrays
// arrive as strings. These helpers turn them back into real values.

export const toBool = (value: unknown): boolean => value === true || value === 'true'

export const toNumber = (value: unknown, fallback = 0): number => {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

export const parseStringArray = (value: unknown, fallback: string[] = []): string[] => {
  if (value === undefined || value === null || value === '') return fallback
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value
    return Array.isArray(parsed) ? parsed.map(String) : fallback
  } catch {
    return fallback
  }
}

// ---------- images ----------

const uploadOne = (file: UploadedFile): Promise<string> =>
  new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: 'nestfinder/properties',
          // Serve modern formats and sensible sizes so pages load fast
          transformation: [{ width: 1200, crop: 'limit', quality: 'auto', fetch_format: 'auto' }],
        },
        (error, result) => {
          if (error || !result) reject(error ?? new Error('Cloudinary upload failed'))
          else resolve(result.secure_url)
        }
      )
      .end(file.data)
  })

/** Uploads every file in `req.files.images` in parallel and returns the URLs in order. */
export const uploadPropertyImages = async (files: UploadedFile | UploadedFile[] | undefined): Promise<string[]> => {
  if (!files) return []
  const list = Array.isArray(files) ? files : [files]
  return Promise.all(list.map(uploadOne))
}
