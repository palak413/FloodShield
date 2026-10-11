export type RiskCategory = 'LOW' | 'MODERATE' | 'HIGH';

export type TideLevel = 'LOW_TIDE' | 'MID_TIDE' | 'SPRING_HIGH_TIDE';

export type DrainageCondition = 'OPTIMAL' | 'STANDARD' | 'SILTED';

export interface LocationGeoData {
  id: string;
  name: string;
  marathiName: string;
  coordinates: [number, number]; // [lat, lng]
  elevationMeters: number;
  depressionIndex: number; // 1-10 scale (10 = deepest saucer underpass)
  proximityToWaterwayMeters: number; // Distance to Mithi River or Arabian Sea / Mahim Creek
  waterwayName: string;
  imperviousRatio: number; // 0.0 - 1.0 (urban asphalt/concrete coverage)
  historicalFrequency: 'VERY_HIGH' | 'HIGH' | 'MODERATE' | 'LOW';
  description: string;
  ward: string;
  holdingTankPresent?: boolean;
}

export interface SimulationParams {
  rainfallMmPerHour: number;
  durationHours: number;
  tideLevel: TideLevel;
  drainageCondition: DrainageCondition;
}

export interface FactorBreakdown {
  precipitationScore: number; // 0-40
  topographyScore: number; // 0-25
  tidalHydraulicScore: number; // 0-20
  surfaceRunoffScore: number; // 0-15
}

export interface RiskAssessmentResult {
  locationId: string;
  locationName: string;
  totalScore: number; // 0 - 100
  category: RiskCategory;
  factors: FactorBreakdown;
  inputParameters: SimulationParams;
  explanation: string;
  precautions: string[];
  provenance: {
    engine: string;
    mode: 'AWS_LAMBDA' | 'LOCAL_FALLBACK';
    timestamp: string;
    executionTimeMs?: number;
    endpointUrl?: string;
  };
}

export type WeatherSourceStatus = 'LIVE' | 'SAMPLE_FALLBACK' | 'UNAVAILABLE';

export interface LiveWeatherData {
  status: WeatherSourceStatus;
  sourceName: string;
  fetchedAt: string;
  lastUpdatedFormatted: string;
  temperatureC: number;
  precipitationMm: number;
  rainMm: number;
  windSpeedKmh: number;
  relativeHumidity: number;
  weatherCode: number;
  weatherDescription: string;
  hourlyForecast: {
    time: string;
    precipitationMm: number;
    rainProbability: number;
  }[];
  errorMessage?: string;
}
