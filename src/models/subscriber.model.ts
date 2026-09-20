import mongoose, { Schema, type Document } from 'mongoose'

// Someone who signed up for the newsletter in the site footer
export interface ISubscriber extends Document {
  email: string
  /** Random secret in the unsubscribe link, so nobody can unsubscribe someone else's address */
  unsubscribeToken?: string
  createdAt: Date
}

const SubscriberSchema = new Schema<ISubscriber>(
  {
    // unique + lowercase: the same address can never be added twice
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    unsubscribeToken: { type: String, index: true },
  },
  { timestamps: true }
)

const Subscriber = mongoose.model<ISubscriber>('Subscriber', SubscriberSchema)
export default Subscriber
