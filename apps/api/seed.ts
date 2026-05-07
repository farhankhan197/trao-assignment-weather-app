import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { User } from './src/models/User';
import { City } from './src/models/City';

dotenv.config();

const TEST_USER = {
  email: 'test@mausam.me',
  name: 'Test User',
  password: 'password123',
};

const DEMO_CITIES = [
  { name: 'London', country: 'United Kingdom', countryCode: 'GB', lat: 51.5074, lon: -0.1278, isFavorite: true },
  { name: 'Tokyo', country: 'Japan', countryCode: 'JP', lat: 35.6762, lon: 139.6503, isFavorite: true },
  { name: 'Dubai', country: 'United Arab Emirates', countryCode: 'AE', lat: 25.2048, lon: 55.2708, isFavorite: true },
  { name: 'New York', country: 'United States', countryCode: 'US', lat: 40.7128, lon: -74.006, isFavorite: true },
];

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not set');
    process.exit(1);
  }

  await mongoose.connect(uri);

  // 1. Create or find test user
  let user = await User.findOne({ email: TEST_USER.email });
  if (!user) {
    const passwordHash = await bcrypt.hash(TEST_USER.password, 12);
    user = await User.create({
      email: TEST_USER.email,
      name: TEST_USER.name,
      passwordHash,
    });
    console.log('Created test user:', user.email);
  }

  const userId = user._id;

  // 2. Remove existing demo cities for this user
  await City.deleteMany({ userId, name: { $in: DEMO_CITIES.map(c => c.name) } });

  // 3. Add demo cities
  for (const cityData of DEMO_CITIES) {
    await City.create({ userId, ...cityData });
  }

  console.log('\nSeed complete. Login with:');
  console.log('  Email: test@mausam.me');
  console.log('  Password: password123');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
