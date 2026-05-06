import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { User } from './src/models/User';
import { City } from './src/models/City';
import { WeatherSnapshot } from './src/models/WeatherSnapshot';
import { getConditionFromCode } from './src/utils/weather.service';

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

// Fake weather codes for 7 days to create varied streaks
const LONDON_CODES = [61, 61, 63, 51, 61, 55, 61]; // Rainy streak
const TOKYO_CODES = [2, 3, 2, 1, 2, 3, 2]; // Cloudy streak
const DUBAI_CODES = [0, 0, 0, 0, 0, 1, 0]; // Sunny streak
const NEWYORK_CODES = [95, 61, 63, 2, 1, 0, 2]; // Mixed

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not set');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

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
  } else {
    console.log('Test user already exists:', user.email);
  }

  const userId = user._id;

  // 2. Remove existing demo cities for this user
  await City.deleteMany({ userId, name: { $in: DEMO_CITIES.map(c => c.name) } });
  console.log('Cleared old demo cities');

  // 3. Add demo cities
  const createdCities = [];
  for (const cityData of DEMO_CITIES) {
    const city = await City.create({
      userId,
      ...cityData,
    });
    createdCities.push(city);
    console.log('Added city:', city.name);
  }

  // 4. Generate 7 days of weather snapshots for streaks
  const today = new Date();
  const allCodes = [LONDON_CODES, TOKYO_CODES, DUBAI_CODES, NEWYORK_CODES];

  for (let i = 0; i < createdCities.length; i++) {
    const city = createdCities[i];
    const codes = allCodes[i];

    for (let day = 0; day < 7; day++) {
      const date = new Date(today);
      date.setDate(date.getDate() - (6 - day));
      const dateStr = date.toISOString().split('T')[0];

      await WeatherSnapshot.findOneAndUpdate(
        { cityId: city._id, date: dateStr },
        {
          cityId: city._id,
          userId,
          date: dateStr,
          condition: getConditionFromCode(codes[day]),
          tempMax: 20 + Math.round(Math.random() * 15),
          tempMin: 10 + Math.round(Math.random() * 10),
          precipitation: Math.round(Math.random() * 10 * 10) / 10,
        },
        { upsert: true, new: true }
      );
    }
    console.log(`Created 7 snapshots for ${city.name}`);
  }

  console.log('\n✅ Seed complete!');
  console.log('Login with:');
  console.log('  Email: test@mausam.me');
  console.log('  Password: password123');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
