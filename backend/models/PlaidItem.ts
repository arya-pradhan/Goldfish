import mongoose, { Schema, Document, Model, Types } from 'mongoose'

export interface IPlaidItem extends Document {
  userId: Types.ObjectId
  accessToken: string
  itemId: string
  institutionName: string
  createdAt: Date
}

const PlaidItemSchema = new Schema<IPlaidItem>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  accessToken: { type: String, required: true },
  itemId: { type: String, required: true },
  institutionName: { type: String, default: 'Unknown Bank' },
  createdAt: { type: Date, default: Date.now },
})

export const PlaidItem: Model<IPlaidItem> =
  mongoose.models.PlaidItem ?? mongoose.model<IPlaidItem>('PlaidItem', PlaidItemSchema)
