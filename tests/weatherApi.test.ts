import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchLiveMumbaiWeather, getOfflineWeatherSample } from '../src/services/weatherApi';

describe('Weather API & Meteorological Fallback Integrity', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('getOfflineWeatherSample returns clearly tagged sample fallback metadata', () => {
    const sample = getOfflineWeatherSample('Connection timed out');
    expect(sample.status).toBe('SAMPLE_FALLBACK');
    expect(sample.sourceName).toContain('Offline');
    expect(sample.errorMessage).toBe('Connection timed out');
    expect(sample.temperatureC).toBe(30.2);
    expect(sample.precipitationMm).toBe(0);
    expect(sample.hourlyForecast.length).toBeGreaterThanOrEqual(3);
    expect(sample.lastUpdatedFormatted).toBeDefined();
    expect(sample.fetchedAt).toBeDefined();
  });

  it('fetchLiveMumbaiWeather parses live telemetry with upstream observation timestamp', async () => {
    const mockMeteoPayload = {
      current: {
        time: '2026-10-11T12:00',
        temperature_2m: 29.5,
        relative_humidity_2m: 85,
        precipitation: 18.2,
        weather_code: 63,
        wind_speed_10m: 22.4,
      },
      hourly: {
        time: ['2026-10-11T12:00', '2026-10-11T13:00', '2026-10-11T14:00'],
        precipitation: [5.0, 12.0, 8.5],
        precipitation_probability: [60, 80, 75],
      },
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockMeteoPayload,
    });
    vi.stubGlobal('fetch', mockFetch);

    const result = await fetchLiveMumbaiWeather();
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(result.status).toBe('LIVE');
    expect(result.temperatureC).toBe(29.5);
    expect(result.precipitationMm).toBe(18.2);
    expect(result.windSpeedKmh).toBe(22.4);
    expect(result.sourceName).toContain('Open-Meteo API');
    expect(result.observationTime).toBe('2026-10-11T12:00');
    expect(result.observedAtFormatted).toBeDefined();
    expect(result.weatherDescription).toContain('Moderate rain');
  });

  it('fetchLiveMumbaiWeather falls back cleanly to sample data on network error', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('Failed to fetch from Open-Meteo'));
    vi.stubGlobal('fetch', mockFetch);

    const result = await fetchLiveMumbaiWeather();
    expect(result.status).toBe('SAMPLE_FALLBACK');
    expect(result.errorMessage).toBe('Failed to fetch from Open-Meteo');
    expect(result.precipitationMm).toBe(0);
    expect(result.sourceName).toContain('Offline');
  });

  it('fetchLiveMumbaiWeather falls back cleanly on HTTP 500 response', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });
    vi.stubGlobal('fetch', mockFetch);

    const result = await fetchLiveMumbaiWeather();
    expect(result.status).toBe('SAMPLE_FALLBACK');
    expect(result.errorMessage).toContain('500');
  });
});
