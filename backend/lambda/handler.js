import { calculateFloodRisk } from './riskEngine.js';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'OPTIONS,GET,POST',
  'Content-Type': 'application/json',
};

/**
 * Validates request payload against strict schema, ranges, finite numbers, and enums.
 * Returns null if valid, or an error message string if invalid.
 */
export function validateAssessmentRequest(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return 'Request body must be a valid JSON object containing "location" and "params".';
  }

  const { location, params } = body;
  if (!location || typeof location !== 'object' || Array.isArray(location)) {
    return 'Missing or invalid "location" object in request body.';
  }
  if (!params || typeof params !== 'object' || Array.isArray(params)) {
    return 'Missing or invalid "params" object in request body.';
  }

  // Validate location fields
  if (typeof location.id !== 'string' || !location.id.trim()) {
    return 'location.id is required and must be a non-empty string.';
  }
  if (typeof location.name !== 'string' || !location.name.trim()) {
    return 'location.name is required and must be a non-empty string.';
  }

  if (typeof location.elevationMeters !== 'number' || !Number.isFinite(location.elevationMeters)) {
    return 'location.elevationMeters must be a finite number.';
  }
  if (location.elevationMeters < -10 || location.elevationMeters > 300) {
    return 'location.elevationMeters is out of valid range [-10, 300].';
  }

  if (typeof location.depressionIndex !== 'number' || !Number.isFinite(location.depressionIndex)) {
    return 'location.depressionIndex must be a finite number.';
  }
  if (location.depressionIndex < 1 || location.depressionIndex > 10) {
    return 'location.depressionIndex is out of valid range [1, 10].';
  }

  if (
    typeof location.proximityToWaterwayMeters !== 'number' ||
    !Number.isFinite(location.proximityToWaterwayMeters)
  ) {
    return 'location.proximityToWaterwayMeters must be a finite number.';
  }
  if (location.proximityToWaterwayMeters < 0 || location.proximityToWaterwayMeters > 50000) {
    return 'location.proximityToWaterwayMeters must be a non-negative number <= 50,000m.';
  }

  if (typeof location.imperviousRatio !== 'number' || !Number.isFinite(location.imperviousRatio)) {
    return 'location.imperviousRatio must be a finite number.';
  }
  if (location.imperviousRatio < 0 || location.imperviousRatio > 1) {
    return 'location.imperviousRatio is out of valid range [0.0, 1.0].';
  }

  // Validate params fields
  if (typeof params.rainfallMmPerHour !== 'number' || !Number.isFinite(params.rainfallMmPerHour)) {
    return 'params.rainfallMmPerHour must be a finite number.';
  }
  if (params.rainfallMmPerHour < 0 || params.rainfallMmPerHour > 300) {
    return 'params.rainfallMmPerHour is out of valid range [0, 300] mm/h.';
  }

  if (typeof params.durationHours !== 'number' || !Number.isFinite(params.durationHours)) {
    return 'params.durationHours must be a finite number.';
  }
  if (params.durationHours < 1 || params.durationHours > 72) {
    return 'params.durationHours is out of valid range [1, 72] hours.';
  }

  const validTideLevels = ['LOW_TIDE', 'MID_TIDE', 'SPRING_HIGH_TIDE'];
  if (!validTideLevels.includes(params.tideLevel)) {
    return `params.tideLevel has unsupported enum value "${params.tideLevel}". Expected one of: ${validTideLevels.join(', ')}.`;
  }

  const validDrainageConditions = ['OPTIMAL', 'STANDARD', 'SILTED'];
  if (!validDrainageConditions.includes(params.drainageCondition)) {
    return `params.drainageCondition has unsupported enum value "${params.drainageCondition}". Expected one of: ${validDrainageConditions.join(', ')}.`;
  }

  return null;
}

export const handler = async (event) => {
  const startTime = Date.now();
  const httpMethod = event.httpMethod || event.requestContext?.http?.method || 'GET';
  const path = event.path || event.rawPath || '/';

  // Handle CORS preflight
  if (httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ message: 'CORS OK' }),
    };
  }

  // Health check endpoint
  if (httpMethod === 'GET' && (path.endsWith('/health') || path === '/' || path === '/health/')) {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        status: 'healthy',
        service: 'FloodShield Risk Assessment API',
        region: process.env.AWS_REGION || 'ap-south-1',
        runtime: `Node.js ${process.version}`,
        timestamp: new Date().toISOString(),
      }),
    };
  }

  // Assessment calculation endpoint
  if (httpMethod === 'POST') {
    try {
      let body = event.body;
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch {
          return {
            statusCode: 400,
            headers: CORS_HEADERS,
            body: JSON.stringify({
              error: 'Invalid JSON payload in request body.',
            }),
          };
        }
      }

      // Strict validation of missing fields, non-finite numbers, ranges, and enums
      const validationError = validateAssessmentRequest(body);
      if (validationError) {
        return {
          statusCode: 400,
          headers: CORS_HEADERS,
          body: JSON.stringify({
            error: validationError,
          }),
        };
      }

      const result = calculateFloodRisk(body.location, body.params);
      const executionTimeMs = Date.now() - startTime;
      result.provenance.executionTimeMs = executionTimeMs;

      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify(result),
      };
    } catch (err) {
      // Log internally for observability, but do not leak exception internals or stack traces in production response
      console.error('Error processing assessment request:', err);
      return {
        statusCode: 500,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          error: 'An internal server error occurred while processing the risk assessment.',
        }),
      };
    }
  }

  return {
    statusCode: 404,
    headers: CORS_HEADERS,
    body: JSON.stringify({ error: `Route not found: ${httpMethod} ${path}` }),
  };
};
