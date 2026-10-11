import { LiveWeatherData } from '../types/flood';

export const OPEN_METEO_MUMBAI_URL =
  'https://api.open-meteo.com/v1/forecast?latitude=19.0760&longitude=72.8777&current=temperature_2m,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m&hourly=precipitation,precipitation_probability&forecast_days=1&timezone=Asia%2FKolkata';

// WMO Weather Interpretation Codes (WW)
export const WMO_CODES: Record<number, string> = {
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

export function getOfflineWeatherSample(errorMessage?: string): LiveWeatherData {
  const now = new Date();
  return {
    status: 'SAMPLE_FALLBACK',
    sourceName: 'Static Demonstration Sample (Open-Meteo Telemetry Offline)',
    fetchedAt: now.toISOString(),
    lastUpdatedFormatted: now.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
    observationTime: undefined,
    observedAtFormatted: 'Historical Baseline',
    temperatureC: 30.2,
    precipitationMm: 0,
    rainMm: 0,
    windSpeedKmh: 12.5,
    relativeHumidity: 78,
    weatherCode: 2,
    weatherDescription: 'Partly Cloudy (Sample Fallback)',
    errorMessage: errorMessage || 'Sample data — live weather unavailable',
    hourlyForecast: [
      { time: '12:00 PM', precipitationMm: 0, rainProbability: 15 },
      { time: '02:00 PM', precipitationMm: 2.1, rainProbability: 35 },
      { time: '04:00 PM', precipitationMm: 5.4, rainProbability: 60 },
    ],
  };
}

export async function fetchLiveMumbaiWeather(
  apiUrl: string = OPEN_METEO_MUMBAI_URL
): Promise<LiveWeatherData> {
  const now = new Date();
  try {
    const res = await fetch(apiUrl, {
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) {
      throw new Error(`Open-Meteo responded with HTTP ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    if (!data || typeof data !== 'object' || !data.current || typeof data.current !== 'object') {
      throw new Error('Malformed weather payload: missing current observation telemetry.');
    }

    const current = data.current;
    if (typeof current.time !== 'string' || !Number.isFinite(current.temperature_2m)) {
      throw new Error('Malformed weather telemetry: missing temperature or timestamp.');
    }

    const hourly = data.hourly && typeof data.hourly === 'object' ? data.hourly : {};

    const code = current.weather_code ?? 0;
    const weatherDescription = WMO_CODES[code] || 'Monsoon Conditions';

    const hourlyForecast: {
      time: string;
      precipitationMm: number;
      rainProbability: number;
    }[] = [];

    if (hourly.time && Array.isArray(hourly.time)) {
      for (let i = 0; i < Math.min(6, hourly.time.length); i++) {
        hourlyForecast.push({
          time: new Date(hourly.time[i]).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          }),
          precipitationMm: Number.isFinite(hourly.precipitation?.[i])
            ? hourly.precipitation[i]
            : 0,
          rainProbability: Number.isFinite(hourly.precipitation_probability?.[i])
            ? hourly.precipitation_probability[i]
            : 0,
        });
      }
    }

    const observationTime = typeof current.time === 'string' ? current.time : undefined;
    const observedAtFormatted = observationTime
      ? new Date(observationTime).toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })
      : undefined;

    return {
      status: 'LIVE',
      sourceName: 'Open-Meteo API (19.076°N, 72.877°E)',
      fetchedAt: now.toISOString(),
      lastUpdatedFormatted: now.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      observationTime,
      observedAtFormatted,
      temperatureC: Number.isFinite(current.temperature_2m) ? current.temperature_2m : 29.5,
      precipitationMm: Number.isFinite(current.precipitation) ? Math.max(0, current.precipitation) : 0,
      rainMm: Number.isFinite(current.rain) ? Math.max(0, current.rain) : 0,
      windSpeedKmh: Number.isFinite(current.wind_speed_10m) ? current.wind_speed_10m : 14.2,
      relativeHumidity: Number.isFinite(current.relative_humidity_2m) ? current.relative_humidity_2m : 82,
      weatherCode: code,
      weatherDescription,
      hourlyForecast,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown network error';
    console.warn('[WeatherService] Live telemetry fetch failed, reverting to marked sample data:', errorMsg);
    return getOfflineWeatherSample(errorMsg);
  }
}
