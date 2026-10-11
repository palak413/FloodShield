import { describe, it, expect } from 'vitest';
import { handler } from '../backend/lambda/handler.js';
import { MUMBAI_LOCATIONS } from '../src/data/mumbaiLocations';

describe('AWS Lambda Handler Execution & Validation Tests', () => {
  const validLocation = MUMBAI_LOCATIONS[0];
  const validParams = {
    rainfallMmPerHour: 65,
    durationHours: 3,
    tideLevel: 'SPRING_HIGH_TIDE',
    drainageCondition: 'SILTED',
  };

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
    expect(body.region).toBe('ap-south-1');
  });

  it('handles CORS OPTIONS preflight with wildcard origin and permitted methods', async () => {
    const event = {
      httpMethod: 'OPTIONS',
      path: '/assess',
    };
    const response = await handler(event);
    expect(response.statusCode).toBe(200);
    expect(response.headers['Access-Control-Allow-Origin']).toBe('*');
    expect(response.headers['Access-Control-Allow-Methods']).toContain('POST');
  });

  it('processes valid POST /assess request and returns accurate server-side provenance', async () => {
    const event = {
      httpMethod: 'POST',
      path: '/assess',
      body: JSON.stringify({
        location: validLocation,
        params: validParams,
      }),
    };

    const response = await handler(event);
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.locationId).toBe(validLocation.id);
    expect(body.category).toBe('HIGH');
    expect(body.totalScore).toBeGreaterThanOrEqual(70);
    expect(body.provenance.engine).toContain('AWS Lambda');
    expect(body.provenance.mode).toBe('AWS_LAMBDA');
    expect(body.provenance.region).toBe('ap-south-1');
    expect(typeof body.provenance.executionTimeMs).toBe('number');
    expect(body.precautions.length).toBe(3);
  });

  it('rejects empty request body with 400 Bad Request', async () => {
    const event = {
      httpMethod: 'POST',
      path: '/assess',
      body: JSON.stringify({}),
    };
    const response = await handler(event);
    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.error).toContain('Missing or invalid "location"');
  });

  it('rejects missing or empty location id and name', async () => {
    const invalidLoc = { ...validLocation, name: '   ' };
    const event = {
      httpMethod: 'POST',
      path: '/assess',
      body: JSON.stringify({
        location: invalidLoc,
        params: validParams,
      }),
    };
    const response = await handler(event);
    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.error).toContain('location.name is required');
  });

  it('rejects non-finite numbers in numeric fields (NaN, Infinity, string)', async () => {
    const badParams = { ...validParams, rainfallMmPerHour: 'sixty' };
    const event = {
      httpMethod: 'POST',
      path: '/assess',
      body: JSON.stringify({
        location: validLocation,
        params: badParams,
      }),
    };
    const response = await handler(event);
    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.error).toContain('params.rainfallMmPerHour must be a finite number');
  });

  it('rejects out-of-range rainfall intensity (< 0 or > 300 mm/h)', async () => {
    const badParams = { ...validParams, rainfallMmPerHour: 999 };
    const event = {
      httpMethod: 'POST',
      path: '/assess',
      body: JSON.stringify({
        location: validLocation,
        params: badParams,
      }),
    };
    const response = await handler(event);
    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.error).toContain('out of valid range');
  });

  it('rejects out-of-range depressionIndex (< 1 or > 10)', async () => {
    const badLocation = { ...validLocation, depressionIndex: 15 };
    const event = {
      httpMethod: 'POST',
      path: '/assess',
      body: JSON.stringify({
        location: badLocation,
        params: validParams,
      }),
    };
    const response = await handler(event);
    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.error).toContain('depressionIndex is out of valid range');
  });

  it('rejects unsupported enum value for tideLevel', async () => {
    const badParams = { ...validParams, tideLevel: 'TSUNAMI_LEVEL' };
    const event = {
      httpMethod: 'POST',
      path: '/assess',
      body: JSON.stringify({
        location: validLocation,
        params: badParams,
      }),
    };
    const response = await handler(event);
    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.error).toContain('params.tideLevel has unsupported enum value');
  });

  it('rejects unsupported enum value for drainageCondition', async () => {
    const badParams = { ...validParams, drainageCondition: 'BROKEN_PIPES' };
    const event = {
      httpMethod: 'POST',
      path: '/assess',
      body: JSON.stringify({
        location: validLocation,
        params: badParams,
      }),
    };
    const response = await handler(event);
    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.error).toContain('params.drainageCondition has unsupported enum value');
  });

  it('handles invalid JSON payload gracefully with 400 Bad Request', async () => {
    const event = {
      httpMethod: 'POST',
      path: '/assess',
      body: 'this is not valid json { [',
    };
    const response = await handler(event);
    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.error).toContain('Invalid JSON payload');
  });

  it('rejects unsupported HTTP methods with 405 Method Not Allowed', async () => {
    const event = {
      httpMethod: 'DELETE',
      path: '/assess',
    };
    const response = await handler(event);
    expect(response.statusCode).toBe(405);
    expect((response.headers as Record<string, string | undefined>)?.['Allow']).toContain('GET, POST, OPTIONS');
    const body = JSON.parse(response.body);
    expect(body.error).toContain('Method DELETE not allowed');
  });

  it('rejects unexpected Content-Type header on POST with 415 Unsupported Media Type', async () => {
    const event = {
      httpMethod: 'POST',
      path: '/assess',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: 'plain text content',
    };
    const response = await handler(event);
    expect(response.statusCode).toBe(415);
    const body = JSON.parse(response.body);
    expect(body.error).toContain('Unsupported Media Type');
  });

  it('rejects NaN and Infinity numbers with 400 Bad Request', async () => {
    const badParams = { ...validParams, rainfallMmPerHour: NaN };
    const event = {
      httpMethod: 'POST',
      path: '/assess',
      body: JSON.stringify({
        location: validLocation,
        params: badParams,
      }),
    };
    const response = await handler(event);
    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.error).toContain('params.rainfallMmPerHour must be a finite number');
  });

  it('accepts exact boundary limits for rainfall (0 mm/h and 300 mm/h) and duration (1h and 72h)', async () => {
    // Upper boundary test
    const maxBoundaryParams = {
      rainfallMmPerHour: 300,
      durationHours: 72,
      tideLevel: 'SPRING_HIGH_TIDE',
      drainageCondition: 'SILTED',
    };
    const maxEvent = {
      httpMethod: 'POST',
      path: '/assess',
      body: JSON.stringify({
        location: validLocation,
        params: maxBoundaryParams,
      }),
    };
    const maxResponse = await handler(maxEvent);
    expect(maxResponse.statusCode).toBe(200);
    const maxBody = JSON.parse(maxResponse.body);
    expect(maxBody.inputParameters.rainfallMmPerHour).toBe(300);
    expect(maxBody.inputParameters.durationHours).toBe(72);

    // Lower boundary test
    const minBoundaryParams = {
      rainfallMmPerHour: 0,
      durationHours: 1,
      tideLevel: 'LOW_TIDE',
      drainageCondition: 'OPTIMAL',
    };
    const minEvent = {
      httpMethod: 'POST',
      path: '/assess',
      body: JSON.stringify({
        location: validLocation,
        params: minBoundaryParams,
      }),
    };
    const minResponse = await handler(minEvent);
    expect(minResponse.statusCode).toBe(200);
    const minBody = JSON.parse(minResponse.body);
    expect(minBody.inputParameters.rainfallMmPerHour).toBe(0);
    expect(minBody.inputParameters.durationHours).toBe(1);
  });

  it('rejects array request body or missing params with 400 Bad Request', async () => {
    const arrayEvent = {
      httpMethod: 'POST',
      path: '/assess',
      body: JSON.stringify([{ location: validLocation, params: validParams }]),
    };
    const arrayResponse = await handler(arrayEvent);
    expect(arrayResponse.statusCode).toBe(400);

    const missingParamsEvent = {
      httpMethod: 'POST',
      path: '/assess',
      body: JSON.stringify({ location: validLocation }),
    };
    const missingResponse = await handler(missingParamsEvent);
    expect(missingResponse.statusCode).toBe(400);
    const missingBody = JSON.parse(missingResponse.body);
    expect(missingBody.error).toContain('Missing or invalid "params"');
  });
});
