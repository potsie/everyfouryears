import { espnFetch } from '@/lib/espn/core';

export interface WeatherCurrent {
  tempC: number;
  code: number;
  windKph: number;
  humidity: number;
}

export interface WeatherDay {
  date: string; // YYYY-MM-DD
  code: number;
  maxC: number;
  minC: number;
  precipPct: number;
}

export interface WeatherData {
  current: WeatherCurrent;
  forecast: WeatherDay[]; // 5 days
}

export async function fetchVenueWeather(lat: number, lng: number): Promise<WeatherData | null> {
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${lat}&longitude=${lng}` +
      `&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
      `&timezone=auto&forecast_days=6`;

    const data = await espnFetch<any>(url, `weather-${lat}-${lng}`, 30);

    const c = data.current;
    const d = data.daily;

    return {
      current: {
        tempC: Math.round(c.temperature_2m),
        code: c.weather_code,
        windKph: Math.round(c.wind_speed_10m),
        humidity: Math.round(c.relative_humidity_2m),
      },
      // skip today (index 0), take next 5 days
      forecast: (d.time as string[]).slice(1, 6).map((date: string, i: number) => ({
        date,
        code: d.weather_code[i + 1],
        maxC: Math.round(d.temperature_2m_max[i + 1]),
        minC: Math.round(d.temperature_2m_min[i + 1]),
        precipPct: d.precipitation_probability_max[i + 1] ?? 0,
      })),
    };
  } catch {
    return null;
  }
}
