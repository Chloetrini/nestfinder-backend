import mongoose, { Schema, type Document } from 'mongoose'

// A message sent from the public Contact page (not tied to a property).
export interface IContactMessage extends Document {
  name: string
  email: string
  phone?: string
  subject: string
  message: string
  status: 'new' | 'responded'
  createdAt: Date
}

const ContactMessageSchema = new Schema<IContactMessage>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    status: { type: String, enum: ['new', 'responded'], default: 'new' },
  },
  { timestamps: true }
)

ContactMessageSchema.index({ createdAt: -1 })

const ContactMessage = mongoose.model<IContactMessage>('ContactMessage', ContactMessageSchema)
export default ContactMessage
