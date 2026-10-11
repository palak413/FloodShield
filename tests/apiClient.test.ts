import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isValidAssessmentResponse,
  requestRiskAssessment,
  checkAwsHealth,
  setCustomEndpointUrl,
} from '../src/services/api';
import { MUMBAI_LOCATIONS } from '../src/data/mumbaiLocations';
import { SimulationParams, RiskAssessmentResult } from '../src/types/flood';

describe('Frontend API Client & Provenance Integrity Tests', () => {
  const sampleLocation = MUMBAI_LOCATIONS[0];
  const sampleParams: SimulationParams = {
    rainfallMmPerHour: 45,
    durationHours: 2,
    tideLevel: 'MID_TIDE',
    drainageCondition: 'STANDARD',
  };

  const validAwsResult: RiskAssessmentResult = {
    locationId: sampleLocation.id,
    locationName: sampleLocation.name,
    totalScore: 58,
    category: 'MODERATE',
    factors: {
      precipitationScore: 24,
      topographyScore: 16,
      tidalHydraulicScore: 8,
      surfaceRunoffScore: 10,
    },
    inputParameters: sampleParams,
    explanation: 'Elevated cautionary risk identified for Hindmata, Dadar.',
    precautions: ['Precaution 1', 'Precaution 2', 'Precaution 3'],
    provenance: {
      engine: 'AWS Lambda (Node.js 22 - ap-south-1)',
      mode: 'AWS_LAMBDA',
      region: 'ap-south-1',
      runtime: 'Node.js v22.12.0',
      timestamp: '2026-10-11T12:00:00.000Z',
      executionTimeMs: 14,
    },
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    setCustomEndpointUrl('https://api.floodshield.mumbai.aws');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    setCustomEndpointUrl(null);
  });

  describe('isValidAssessmentResponse schema validator', () => {
    it('accepts a fully conforming AWS response', () => {
      expect(isValidAssessmentResponse(validAwsResult)).toBe(true);
    });

    it('rejects null, non-objects, or arrays', () => {
      expect(isValidAssessmentResponse(null)).toBe(false);
      expect(isValidAssessmentResponse(undefined)).toBe(false);
      expect(isValidAssessmentResponse('string')).toBe(false);
      expect(isValidAssessmentResponse([validAwsResult])).toBe(false);
    });

    it('rejects non-finite or out-of-range totalScore', () => {
      expect(isValidAssessmentResponse({ ...validAwsResult, totalScore: NaN })).toBe(false);
      expect(isValidAssessmentResponse({ ...validAwsResult, totalScore: Infinity })).toBe(false);
      expect(isValidAssessmentResponse({ ...validAwsResult, totalScore: -5 })).toBe(false);
      expect(isValidAssessmentResponse({ ...validAwsResult, totalScore: 105 })).toBe(false);
    });

    it('rejects unsupported risk category', () => {
      expect(isValidAssessmentResponse({ ...validAwsResult, category: 'CATASTROPHIC' as any })).toBe(false);
      expect(isValidAssessmentResponse({ ...validAwsResult, category: '' as any })).toBe(false);
    });

    it('rejects invalid factor breakdown scores', () => {
      const badFactors = { ...validAwsResult, factors: { ...validAwsResult.factors, precipitationScore: 99 } };
      expect(isValidAssessmentResponse(badFactors)).toBe(false);

      const nanFactors = { ...validAwsResult, factors: { ...validAwsResult.factors, topographyScore: 'invalid' as any } };
      expect(isValidAssessmentResponse(nanFactors)).toBe(false);
    });

    it('strictly enforces provenance.mode === AWS_LAMBDA', () => {
      const spoofedResult = {
        ...validAwsResult,
        provenance: {
          ...validAwsResult.provenance,
          mode: 'LOCAL_FALLBACK' as const,
        },
      };
      // Must not accept LOCAL_FALLBACK as valid AWS response
      expect(isValidAssessmentResponse(spoofedResult)).toBe(false);
    });

    it('rejects response if locationId does not match string', () => {
      expect(isValidAssessmentResponse({ ...validAwsResult, locationId: 12345 as any })).toBe(false);
    });
  });

  describe('requestRiskAssessment client behavior', () => {
    it('returns verified AWS response when endpoint returns 200 and schema is valid', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => validAwsResult,
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await requestRiskAssessment(sampleLocation, sampleParams);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result.provenance.mode).toBe('AWS_LAMBDA');
      expect(result.totalScore).toBe(58);
      expect(result.category).toBe('MODERATE');
    });

    it('falls back to local heuristic calculation if API returns 500 error', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await requestRiskAssessment(sampleLocation, sampleParams);
      expect(result.provenance.mode).toBe('LOCAL_FALLBACK');
      expect(result.provenance.engine).toContain('Local Heuristic Engine');
      expect(typeof result.totalScore).toBe('number');
    });

    it('falls back to local calculation if API returns malformed payload schema', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ status: 'success', unexpectedField: true }), // Missing required fields
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await requestRiskAssessment(sampleLocation, sampleParams);
      expect(result.provenance.mode).toBe('LOCAL_FALLBACK');
      expect(result.provenance.engine).toContain('Local Heuristic Engine');
    });

    it('falls back to local calculation if network request rejects', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network offline'));
      vi.stubGlobal('fetch', mockFetch);

      const result = await requestRiskAssessment(sampleLocation, sampleParams);
      expect(result.provenance.mode).toBe('LOCAL_FALLBACK');
      expect(result.totalScore).toBeGreaterThanOrEqual(0);
    });

    it('falls back cleanly to local calculation when server returns non-JSON or HTML 200 response', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => {
          throw new SyntaxError('Unexpected token < in JSON at position 0');
        },
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await requestRiskAssessment(sampleLocation, sampleParams);
      expect(result.provenance.mode).toBe('LOCAL_FALLBACK');
      expect(result.provenance.engine).toContain('Local Heuristic Engine');
    });

    it('falls back to local calculation when server response has totalScore > 100', async () => {
      const invalidScorePayload = {
        ...validAwsResult,
        totalScore: 110,
      };
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => invalidScorePayload,
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await requestRiskAssessment(sampleLocation, sampleParams);
      expect(result.provenance.mode).toBe('LOCAL_FALLBACK');
    });
  });

  describe('checkAwsHealth client behavior', () => {
    it('reports isAwsLive: true when /health responds healthy', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ status: 'healthy', region: 'ap-south-1', runtime: 'Node.js v22.12.0' }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const status = await checkAwsHealth();
      expect(status.isAwsLive).toBe(true);
      expect(status.runtime).toBeDefined();
    });

    it('reports isAwsLive: false when health endpoint fails', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Connection refused'));
      vi.stubGlobal('fetch', mockFetch);

      const status = await checkAwsHealth();
      expect(status.isAwsLive).toBe(false);
    });
  });
});
