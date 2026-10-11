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
  const rainfallMmPerHour = Math.max(0, Math.min(300, Number(params.rainfallMmPerHour) || 0));
  const durationHours = Math.max(1, Math.min(72, Number(params.durationHours) || 1));
  const tideLevel = params.tideLevel || 'LOW_TIDE';
  const drainageCondition = params.drainageCondition || 'STANDARD';

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
      engine: mode === 'AWS_LAMBDA' ? 'AWS Lambda (Node.js 22 - ap-south-1)' : 'Local Heuristic Engine (In-Browser Fallback)',
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
    parts.push(`Spring High Tide can restrict gravity outfall into the Arabian Sea when seawater levels rise above discharge thresholds.`);
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
        `AVOID LOW-LYING UNDERPASS TRANSIT: Underpasses accumulate localized runoff rapidly; delay transit and check official Mumbai Traffic Police advisories rather than risking vehicular stall.`
      );
    } else {
      recommendations.push(
        `EXERCISE HIGH CAUTION ON ROADWAYS: Elevated probability of localized street waterlogging exceeding curb depth; consult municipal ward bulletins before transit.`
      );
    }

    recommendations.push(
      `VEHICLE PRESERVATION ADVISORY: Consider moving parked vehicles from low-lying basements and ground lots to elevated parking decks where feasible.`
    );

    if (params.tideLevel === 'SPRING_HIGH_TIDE') {
      recommendations.push(
        `TIDAL LOCK ADVISORY: Stormwater outfall gates may close during spring high tides to prevent seawater backflow, which can slow drainage. Consult BMC Disaster Management updates.`
      );
    } else {
      recommendations.push(
        `MONITOR BMC DISASTER HELPLINE: Check ward ${location.ward} local municipal updates before undertaking essential travel.`
      );
    }
  } else if (category === 'MODERATE') {
    recommendations.push(
      `EXERCISE TRANSIT CAUTION: Reduce vehicle speeds and maintain safe braking distances due to potential wet pavement and intermittent street water accumulation.`
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
      `ALLOW COMMUTE BUFFER: Commute delays are common during localized waterlogging; check suburban rail and traffic police updates before traveling.`
    );
  } else {
    recommendations.push(
      `MONITOR ROUTINE PASSABILITY: Precipitation remains within baseline municipal drainage capacities (BMC 25 mm/h design); exercise normal monsoon vigilance.`
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
