import { describe, it, expect } from 'vitest';
import { calculateFloodRisk } from '../src/services/riskEngine';
import { MUMBAI_LOCATIONS } from '../src/data/mumbaiLocations';
import { SimulationParams } from '../src/types/flood';

describe('FloodShield Deterministic Risk Engine', () => {
  const milanSubway = MUMBAI_LOCATIONS.find((l) => l.id === 'milan-subway')!;
  const marineDrive = MUMBAI_LOCATIONS.find((l) => l.id === 'marine-drive')!;
  const kurlaMithi = MUMBAI_LOCATIONS.find((l) => l.id === 'kurla-mithi-basin')!;

  it('calculates low risk for clear weather (0 mm/h rainfall)', () => {
    const dryParams: SimulationParams = {
      rainfallMmPerHour: 0,
      durationHours: 1,
      tideLevel: 'LOW_TIDE',
      drainageCondition: 'OPTIMAL',
    };

    const result = calculateFloodRisk(milanSubway, dryParams);
    expect(result.factors.precipitationScore).toBe(0);
    expect(result.factors.surfaceRunoffScore).toBe(0);
    expect(result.totalScore).toBeLessThan(40);
    expect(result.category).toBe('LOW');
    expect(result.precautions).toHaveLength(3);
  });

  it('triggers HIGH risk under cloudburst downpour and Spring High Tide', () => {
    const extremeParams: SimulationParams = {
      rainfallMmPerHour: 80,
      durationHours: 3,
      tideLevel: 'SPRING_HIGH_TIDE',
      drainageCondition: 'SILTED',
    };

    const result = calculateFloodRisk(milanSubway, extremeParams);
    expect(result.totalScore).toBeGreaterThanOrEqual(70);
    expect(result.category).toBe('HIGH');
    expect(result.factors.precipitationScore).toBeGreaterThanOrEqual(30);
    expect(result.factors.tidalHydraulicScore).toBeGreaterThanOrEqual(15);
    expect(result.explanation).toContain('Severe waterlogging risk');
    expect(result.precautions[0]).toContain('AVOID LOW-LYING UNDERPASS');
  });

  it('demonstrates topographical variance between low-lying depression and coastal ridge', () => {
    const moderateRain: SimulationParams = {
      rainfallMmPerHour: 35,
      durationHours: 2,
      tideLevel: 'MID_TIDE',
      drainageCondition: 'STANDARD',
    };

    const milanResult = calculateFloodRisk(milanSubway, moderateRain);
    const marineResult = calculateFloodRisk(marineDrive, moderateRain);

    // Milan subway (depression index 10) must be substantially riskier than Marine Drive (depression index 2)
    expect(milanResult.factors.topographyScore).toBeGreaterThan(marineResult.factors.topographyScore);
    expect(milanResult.totalScore).toBeGreaterThan(marineResult.totalScore);
  });

  it('reflects tidal gate mechanics where Spring High Tide escalates hydraulic resistance', () => {
    const baseRain: SimulationParams = {
      rainfallMmPerHour: 40,
      durationHours: 2,
      tideLevel: 'LOW_TIDE',
      drainageCondition: 'STANDARD',
    };

    const springTideParams: SimulationParams = {
      ...baseRain,
      tideLevel: 'SPRING_HIGH_TIDE',
    };

    const lowTideResult = calculateFloodRisk(kurlaMithi, baseRain);
    const highTideResult = calculateFloodRisk(kurlaMithi, springTideParams);

    expect(highTideResult.factors.tidalHydraulicScore).toBeGreaterThan(
      lowTideResult.factors.tidalHydraulicScore
    );
    expect(highTideResult.totalScore).toBeGreaterThan(lowTideResult.totalScore);
  });

  it('ensures output scores stay bounded within [0, 100]', () => {
    // Test with maximum extreme parameters
    const maxParams: SimulationParams = {
      rainfallMmPerHour: 200,
      durationHours: 24,
      tideLevel: 'SPRING_HIGH_TIDE',
      drainageCondition: 'SILTED',
    };

    const result = calculateFloodRisk(milanSubway, maxParams);
    expect(result.totalScore).toBeLessThanOrEqual(100);
    expect(result.totalScore).toBeGreaterThanOrEqual(0);
  });
});
