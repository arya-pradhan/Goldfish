import mongoose, { Schema, Document, Model, Types } from 'mongoose'

export interface ITransaction extends Document {
  userId: Types.ObjectId
  plaidTransactionId: string
  amount: number
  merchantName: string
  category: string
  lat?: number
  lng?: number
  date: Date
  geocodedFallback: boolean
}

const TransactionSchema = new Schema<ITransaction>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  plaidTransactionId: { type: String, required: true },
  amount: { type: Number, required: true },
  merchantName: { type: String, default: 'Unknown Merchant' },
  category: { type: String, default: 'Other' },
  lat: { type: Number },
  lng: { type: Number },
  date: { type: Date, required: true },
  geocodedFallback: { type: Boolean, default: false },
})

TransactionSchema.index({ userId: 1, plaidTransactionId: 1 }, { unique: true })

export const Transaction: Model<ITransaction> =
  mongoose.models.Transaction ?? mongoose.model<ITransaction>('Transaction', TransactionSchema)
