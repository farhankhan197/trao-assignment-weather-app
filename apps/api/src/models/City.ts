import mongoose, { Document, Schema } from 'mongoose';


// city interface
export interface ICity extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  name: string;
  country: string;
  countryCode: string;
  lat: number;
  lon: number;
  isFavorite: boolean;
  addedAt: Date;
}

//city schema
const CitySchema = new Schema<ICity>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  name: { type: String, required: true },
  country: { type: String, required: true },
  countryCode: { type: String, required: true },
  lat: { type: Number, required: true },
  lon: { type: Number, required: true },
  isFavorite: { type: Boolean, default: false },
}, { timestamps: { createdAt: 'addedAt', updatedAt: false } });

// ensures a user can only add the same city once
CitySchema.index({ userId: 1, lat: 1, lon: 1 }, { unique: true });

export const City = mongoose.model<ICity>('City', CitySchema);
