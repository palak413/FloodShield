import {
  LocationGeoData,
  SimulationParams,
  RiskAssessmentResult,
  RiskCategory,
  FactorBreakdown,
} from '../types/flood';

/**
 * Deterministic Heuristic Risk Assessment Engine for Mumbai Urban Flooding
 * 
 * Note on Methodology:
 * This model computes a normalized vulnerability index (0-100) based on municipal
 * drainage engineering benchmarks for Mumbai (BMC design capacity: 25-50 mm/h),
 * localized topography/depression depth, tidal gate mechanics (Spring Tide > 4.5m closure),
 * and urban impervious land cover.
 * 
 * It illustrates relative flood susceptibility under specific weather & tidal scenarios,
 * and should not be presented as a real-time hydrodynamic telemetry sensor.
 */
export function calculateFloodRisk(
  location: LocationGeoData,
  params: SimulationParams,
  mode: 'AWS_LAMBDA' | 'LOCAL_FALLBACK' = 'LOCAL_FALLBACK',
  endpointUrl?: string
): RiskAssessmentResult {
  const { rainfallMmPerHour, durationHours, tideLevel, drainageCondition } = params;

  // 1. Precipitation Load (0 - 40 points)
  let precipitationScore = 0;
  if (rainfallMmPerHour > 0) {
    // BMC historic design capacity threshold ~ 25 mm/h
    const normalizedIntensity = Math.min(1.2, rainfallMmPerHour / 80);
    const durationAccumulationFactor = 1 + 0.12 * Math.min(6, Math.max(1, durationHours) - 1);
    const rawPrecip = 40 * Math.pow(normalizedIntensity, 0.9) * (durationAccumulationFactor / 1.6);
    precipitationScore = Math.min(40, Math.max(0, Math.round(rawPrecip)));
  }

  // 2. Topographical Vulnerability (0 - 25 points)
  // Higher depressionIndex (1-10) and lower elevation increase risk
  const depressionWeight = (location.depressionIndex / 10) * 15;
  const elevationWeight = Math.max(0, (10 - location.elevationMeters) * 0.9);
  let rawTopo = depressionWeight + elevationWeight;

  // Holding tank mitigation discount during moderate rains
  if (location.holdingTankPresent && rainfallMmPerHour < 60) {
    rawTopo = Math.max(2, rawTopo - 3);
  }
  const topographyScore = Math.min(25, Math.max(2, Math.round(rawTopo)));

  // 3. Hydraulic & Tidal Resistance (0 - 20 points)
  // Mumbai stormwater outfalls shut when sea tide reaches > 4.5m
  let tidePoints = 2; // LOW_TIDE default
  if (tideLevel === 'MID_TIDE') {
    tidePoints = 8;
  } else if (tideLevel === 'SPRING_HIGH_TIDE') {
    tidePoints = 15;
  }

  let drainagePoints = 0;
  if (drainageCondition === 'OPTIMAL') {
    drainagePoints = -3;
  } else if (drainageCondition === 'SILTED') {
    drainagePoints = 5;
  }

  // Proximity to waterway penalty if spring tide causes river overflow
  let waterwaySurge = 0;
  if (location.proximityToWaterwayMeters < 500 && tideLevel === 'SPRING_HIGH_TIDE') {
    waterwaySurge = 3;
  }

  const tidalHydraulicScore = Math.min(
    20,
    Math.max(0, Math.round(tidePoints + drainagePoints + waterwaySurge))
  );

  // 4. Surface Runoff & Land Cover (0 - 15 points)
  let surfaceRunoffScore = 0;
  if (rainfallMmPerHour > 0) {
    const runoffIntensityScale = Math.min(1.0, rainfallMmPerHour / 30);
    surfaceRunoffScore = Math.min(
      15,
      Math.max(1, Math.round(15 * location.imperviousRatio * runoffIntensityScale))
    );
  }

  // Composite Score
  const totalScore = Math.min(
    100,
    Math.max(0, precipitationScore + topographyScore + tidalHydraulicScore + surfaceRunoffScore)
  );

  // Classification Category
  let category: RiskCategory = 'LOW';
  if (totalScore >= 70) {
    category = 'HIGH';
  } else if (totalScore >= 40) {
    category = 'MODERATE';
  }

  const factors: FactorBreakdown = {
    precipitationScore,
    topographyScore,
    tidalHydraulicScore,
    surfaceRunoffScore,
  };

  // Human-readable Explanation
  const explanation = generateExplanation(location, params, factors, totalScore, category);

  // Practical Recommendations
  const precautions = generatePrecautions(location, params, category);

  return {
    locationId: location.id,
    locationName: location.name,
    totalScore,
    category,
    factors,
    inputParameters: params,
    explanation,
    precautions,
    provenance: {
      engine: mode === 'AWS_LAMBDA' ? 'AWS Lambda (Node.js 20 - ap-south-1)' : 'Local Heuristic Engine (In-Browser Fallback)',
      mode,
      timestamp: new Date().toISOString(),
      endpointUrl,
    },
  };
}

function generateExplanation(
  location: LocationGeoData,
  params: SimulationParams,
  factors: FactorBreakdown,
  score: number,
  category: RiskCategory
): string {
  const parts: string[] = [];

  if (category === 'HIGH') {
    parts.push(`Severe waterlogging risk (${score}/100) detected for ${location.name}.`);
  } else if (category === 'MODERATE') {
    parts.push(`Elevated cautionary risk (${score}/100) identified for ${location.name}.`);
  } else {
    parts.push(`Low vulnerability profile (${score}/100) under current parameters.`);
  }

  // Key drivers
  if (params.rainfallMmPerHour >= 60) {
    parts.push(
      `Precipitation intensity (${params.rainfallMmPerHour} mm/h) exceeds standard BMC culvert throughput.`
    );
  } else if (params.rainfallMmPerHour > 25) {
    parts.push(`Rainfall volume (${params.rainfallMmPerHour} mm/h) approaches storm drain capacity.`);
  }

  if (location.depressionIndex >= 8) {
    parts.push(`Topographical depression index (${location.depressionIndex}/10) accelerates localized saucer accumulation.`);
  }

  if (params.tideLevel === 'SPRING_HIGH_TIDE') {
    parts.push(`Spring High Tide prevents Arabian Sea gravity outfall; floodgates remain shut.`);
  }

  if (location.proximityToWaterwayMeters <= 300) {
    parts.push(`Proximity (${location.proximityToWaterwayMeters}m) to ${location.waterwayName} elevates backflow hazard.`);
  }

  if (location.holdingTankPresent && score < 75) {
    parts.push(`BMC holding tank active, offering short-term buffer capacity.`);
  }

  return parts.join(' ');
}

function generatePrecautions(
  location: LocationGeoData,
  params: SimulationParams,
  category: RiskCategory
): string[] {
  const recommendations: string[] = [];

  if (category === 'HIGH') {
    if (location.depressionIndex >= 8) {
      recommendations.push(
        `AVOID UNDERPASS TRANSIT: Divert via elevated arterial routes (e.g. flyovers) to avoid submerged vehicular stalls.`
      );
    } else {
      recommendations.push(
        `SUSPEND GROUND-LEVEL LOGISTICS: Severe sheet inundation expected along major thoroughfares.`
      );
    }

    recommendations.push(
      `VEHICLE PRESERVATION: Relocate parked vehicles from basements and ground lots to upper podium decks immediately.`
    );

    if (params.tideLevel === 'SPRING_HIGH_TIDE') {
      recommendations.push(
        `TIDAL PEAK ADVISORY: Outfall gates closed during high tide; expect peak water stagnation for the next 2-3 hours.`
      );
    } else {
      recommendations.push(
        `MONITOR BMC DISASTER HELPLINE: Check ward ${location.ward} local municipal updates before undertaking essential travel.`
      );
    }
  } else if (category === 'MODERATE') {
    recommendations.push(
      `EXERCISE TRANSIT CAUTION: Slow vehicle speeds due to reduced visibility and intermittent road water accumulation.`
    );

    if (location.depressionIndex >= 8) {
      recommendations.push(
        `MONITOR UNDERPASS PASSABILITY: Verify traffic police water-depth markers before entering subway ramps.`
      );
    } else {
      recommendations.push(
        `CLEAR LOCAL DRAINS: Ensure storm grates around commercial/residential boundaries are free from debris blockage.`
      );
    }

    recommendations.push(
      `BUFFER COMMUTE TIMES: Allow 30-45 minutes additional travel time across suburban rail and road corridors.`
    );
  } else {
    recommendations.push(
      `NORMAL ROUTINE PERMITTED: Roadways and drainage infrastructure operating within nominal safety thresholds.`
    );
    recommendations.push(
      `CONTINUE RAIN MONITORING: Stay informed via weather alerts if cloudburst activity approaches southern/suburban Mumbai.`
    );
    recommendations.push(
      `BASIC DRAINAGE CHECKS: Keep household and building downspout filters clear of plastic litter.`
    );
  }

  return recommendations.slice(0, 3);
}
