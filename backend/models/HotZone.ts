import mongoose, { Schema, Document, Model, Types } from 'mongoose'

export interface IHotZone extends Document {
  userId: Types.ObjectId
  label: string
  centerLat: number
  centerLng: number
  radiusMeters: number
  totalSpend: number
  visitCount: number
  transactionIds: Types.ObjectId[]
}

const HotZoneSchema = new Schema<IHotZone>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  label: { type: String, required: true },
  centerLat: { type: Number, required: true },
  centerLng: { type: Number, required: true },
  radiusMeters: { type: Number, default: 200 },
  totalSpend: { type: Number, default: 0 },
  visitCount: { type: Number, default: 0 },
  transactionIds: [{ type: Schema.Types.ObjectId, ref: 'Transaction' }],
})

export const HotZone: Model<IHotZone> =
  mongoose.models.HotZone ?? mongoose.model<IHotZone>('HotZone', HotZoneSchema)
