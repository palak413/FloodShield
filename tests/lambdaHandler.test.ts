import { describe, it, expect } from 'vitest';
import { handler } from '../backend/lambda/handler.js';
import { MUMBAI_LOCATIONS } from '../src/data/mumbaiLocations';

describe('AWS Lambda Handler Execution Test', () => {
  it('returns healthy status on GET /health', async () => {
    const event = {
      httpMethod: 'GET',
      path: '/health',
    };
    const response = await handler(event);
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.status).toBe('healthy');
    expect(body.service).toContain('FloodShield');
  });

  it('handles CORS OPTIONS preflight', async () => {
    const event = {
      httpMethod: 'OPTIONS',
      path: '/assess',
    };
    const response = await handler(event);
    expect(response.statusCode).toBe(200);
    expect(response.headers['Access-Control-Allow-Origin']).toBe('*');
  });

  it('processes POST /assess successfully with validated factors', async () => {
    const location = MUMBAI_LOCATIONS[0];
    const event = {
      httpMethod: 'POST',
      path: '/assess',
      body: JSON.stringify({
        location,
        params: {
          rainfallMmPerHour: 65,
          durationHours: 3,
          tideLevel: 'SPRING_HIGH_TIDE',
          drainageCondition: 'SILTED',
        },
      }),
    };

    const response = await handler(event);
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.locationId).toBe(location.id);
    expect(body.category).toBe('HIGH');
    expect(body.totalScore).toBeGreaterThanOrEqual(70);
    expect(body.provenance.engine).toContain('AWS Lambda');
    expect(body.provenance.executionTimeMs).toBeDefined();
    expect(body.precautions.length).toBe(3);
  });

  it('rejects malformed requests with 400 Bad Request', async () => {
    const event = {
      httpMethod: 'POST',
      path: '/assess',
      body: JSON.stringify({}),
    };
    const response = await handler(event);
    expect(response.statusCode).toBe(400);
  });
});
