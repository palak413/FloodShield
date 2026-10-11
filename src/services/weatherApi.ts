import { LiveWeatherData } from '../types/flood';

const OPEN_METEO_MUMBAI_URL =
  'https://api.open-meteo.com/v1/forecast?latitude=19.0760&longitude=72.8777&current=temperature_2m,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m&hourly=precipitation,precipitation_probability&forecast_days=1&timezone=Asia%2FKolkata';

// WMO Weather Interpretation Codes (WW)
const WMO_CODES: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers (Cloudburst risk)',
  95: 'Thunderstorm',
  96: 'Thunderstorm with slight hail',
  99: 'Thunderstorm with heavy hail',
};

export async function fetchLiveMumbaiWeather(): Promise<LiveWeatherData> {
  try {
    const res = await fetch(OPEN_METEO_MUMBAI_URL);
    if (!res.ok) {
      throw new Error(`Open-Meteo returned status ${res.status}`);
    }
    const data = await res.json();
    const current = data.current || {};
    const hourly = data.hourly || {};

    const code = current.weather_code ?? 0;
    const weatherDescription = WMO_CODES[code] || 'Monsoon Conditions';

    const hourlyForecast = [];
    if (hourly.time && Array.isArray(hourly.time)) {
      for (let i = 0; i < Math.min(6, hourly.time.length); i++) {
        hourlyForecast.push({
          time: new Date(hourly.time[i]).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          }),
          precipitationMm: hourly.precipitation?.[i] ?? 0,
          rainProbability: hourly.precipitation_probability?.[i] ?? 0,
        });
      }
    }

    return {
      temperatureC: current.temperature_2m ?? 29.5,
      precipitationMm: current.precipitation ?? 0,
      rainMm: current.rain ?? 0,
      windSpeedKmh: current.wind_speed_10m ?? 14.2,
      relativeHumidity: current.relative_humidity_2m ?? 82,
      weatherCode: code,
      weatherDescription,
      lastUpdated: new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      hourlyForecast,
    };
  } catch (err) {
    console.warn('Live weather fetch failed, utilizing baseline telemetry', err);
    return {
      temperatureC: 30.2,
      precipitationMm: 0,
      rainMm: 0,
      windSpeedKmh: 12.5,
      relativeHumidity: 78,
      weatherCode: 2,
      weatherDescription: 'Partly Cloudy (Baseline Telemetry)',
      lastUpdated: new Date().toLocaleTimeString('en-IN'),
      hourlyForecast: [
        { time: '12:00 PM', precipitationMm: 0, rainProbability: 15 },
        { time: '02:00 PM', precipitationMm: 2.1, rainProbability: 35 },
        { time: '04:00 PM', precipitationMm: 5.4, rainProbability: 60 },
      ],
    };
  }
}
