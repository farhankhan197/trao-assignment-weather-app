import mongoose, { Document, Schema } from 'mongoose';

export interface ICalendarAlert extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  eventId: string;
  eventTitle: string;
  eventStart: Date;
  eventLocation: string;
  lat: number;
  lon: number;
  forecastDate: string;
  condition: string;
  tempMax: number;
  tempMin: number;
  precipitation: number;
  severity: 'low' | 'medium' | 'high';
  message: string;
  read: boolean;
  createdAt: Date;
}

const CalendarAlertSchema = new Schema<ICalendarAlert>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    eventId: { type: String, required: true },
    eventTitle: { type: String, required: true },
    eventStart: { type: Date, required: true },
    eventLocation: { type: String, required: true },
    lat: { type: Number, required: true },
    lon: { type: Number, required: true },
    forecastDate: { type: String, required: true },
    condition: { type: String, required: true },
    tempMax: { type: Number, required: true },
    tempMin: { type: Number, required: true },
    precipitation: { type: Number, default: 0 },
    severity: { type: String, enum: ['low', 'medium', 'high'], required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Prevent duplicate alerts for same user+event+date
CalendarAlertSchema.index({ userId: 1, eventId: 1, forecastDate: 1 }, { unique: true });

// Fast queries for unread alerts
CalendarAlertSchema.index({ userId: 1, read: 1, createdAt: -1 });

export const CalendarAlert = mongoose.model<ICalendarAlert>('CalendarAlert', CalendarAlertSchema);
