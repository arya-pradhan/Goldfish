import mongoose, { Schema, Document, Model, Types } from 'mongoose'

export interface IResistEvent extends Document {
  userId: Types.ObjectId
  hotZoneId: Types.ObjectId
  timestamp: Date
}

const ResistEventSchema = new Schema<IResistEvent>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  hotZoneId: { type: Schema.Types.ObjectId, ref: 'HotZone', required: true },
  timestamp: { type: Date, default: Date.now },
})

export const ResistEvent: Model<IResistEvent> =
  mongoose.models.ResistEvent ?? mongoose.model<IResistEvent>('ResistEvent', ResistEventSchema)
