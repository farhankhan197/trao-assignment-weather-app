import mongoose, { Document, Schema } from 'mongoose';


// weather snapshot interface
export interface IWeatherSnapshot extends Document {
  cityId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  date: string;
  condition: string;
  tempMax: number;
  tempMin: number;
  precipitation: number;
}

// weather snapshot schema
const WeatherSnapshotSchema = new Schema<IWeatherSnapshot>({
  cityId: { type: Schema.Types.ObjectId, ref: 'City', required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true },
  condition: { type: String, required: true },
  tempMax: { type: Number, required: true },
  tempMin: { type: Number, required: true },
  precipitation: { type: Number, required: true },
});

// creates an index for faster queries
WeatherSnapshotSchema.index({ cityId: 1, date: -1 });

export const WeatherSnapshot = mongoose.model<IWeatherSnapshot>('WeatherSnapshot', WeatherSnapshotSchema);
