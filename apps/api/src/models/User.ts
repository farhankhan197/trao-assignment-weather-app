import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';



// user interface
export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: Date;
  googleAccessToken?: string;
  googleRefreshToken?: string;
  googleTokenExpiry?: Date;
  calendarConnected: boolean;
  comparePassword(password: string): Promise<boolean>;
}


// user schema
const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  googleAccessToken: { type: String, default: null },
  googleRefreshToken: { type: String, default: null },
  googleTokenExpiry: { type: Date, default: null },
  calendarConnected: { type: Boolean, default: false },
}, { timestamps: true });

// delete passwordHash in JSON responses
UserSchema.set('toJSON', {
  transform: (_doc: any, ret: any) => {
    delete ret.passwordHash;
    return ret;
  },
});

// verify password
UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.passwordHash);
};

export const User = mongoose.model<IUser>('User', UserSchema);
