import cron from 'node-cron';
import { City } from '../models/City';
import { WeatherSnapshot } from '../models/WeatherSnapshot';
import { fetchCurrentWeather, getConditionFromCode } from './weather.service';

const today = () => new Date().toISOString().split('T')[0];

export const startSnapshotJob = () => {
  // Run daily at 11:55 PM UTC
  cron.schedule('55 23 * * *', async () => {
    console.log('[SnapshotJob] Running daily weather snapshot...');
    const cities = await City.find({});

    for (const city of cities) {
      try {
        const data = await fetchCurrentWeather(city.lat, city.lon);
        const code = data.current.weather_code;

        await WeatherSnapshot.findOneAndUpdate(
          { cityId: city._id, date: today() },
          {
            cityId: city._id,
            userId: city.userId,
            date: today(),
            condition: getConditionFromCode(code),
            tempMax: data.daily.temperature_2m_max[0],
            tempMin: data.daily.temperature_2m_min[0],
            precipitation: data.daily.precipitation_sum[0],
          },
          { upsert: true, new: true }
        );
      } catch (err) {
        console.error(`[SnapshotJob] Failed for city ${city.name}:`, err);
      }
    }
    console.log('[SnapshotJob] Done');
  });

  console.log('[SnapshotJob] Scheduled daily at 23:55 UTC');
};
