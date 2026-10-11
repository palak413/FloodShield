import {
  LocationGeoData,
  SimulationParams,
  RiskAssessmentResult,
  RiskCategory,
} from '../types/flood';
import { calculateFloodRisk } from './riskEngine';

let customEndpointUrl: string | null = null;

export function setCustomEndpointUrl(url: string | null): void {
  customEndpointUrl = url;
}

export function getActiveEndpointUrl(): string {
  if (customEndpointUrl !== null) return customEndpointUrl;
  return import.meta.env.VITE_AWS_API_URL || '';
}

export interface ApiStatus {
  isAwsLive: boolean;
  endpointUrl: string;
  latencyMs?: number;
  lastChecked: string;
  error?: string;
  engineName?: string;
  runtime?: string;
}

/**
 * Validates the assessment response schema strictly before using it.
 * Ensures the response structure, types, ranges, and explicit provenance are valid.
 */
export function isValidAssessmentResponse(data: unknown): data is RiskAssessmentResult {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return false;
  }

  const res = data as Record<string, unknown>;

  if (typeof res.locationId !== 'string' || !res.locationId.trim()) return false;
  if (typeof res.locationName !== 'string' || !res.locationName.trim()) return false;

  if (
    typeof res.totalScore !== 'number' ||
    !Number.isFinite(res.totalScore) ||
    res.totalScore < 0 ||
    res.totalScore > 100
  ) {
    return false;
  }

  const validCategories: RiskCategory[] = ['LOW', 'MODERATE', 'HIGH'];
  if (!validCategories.includes(res.category as RiskCategory)) return false;

  if (!res.factors || typeof res.factors !== 'object' || Array.isArray(res.factors)) return false;
  const factors = res.factors as Record<string, unknown>;
  if (
    typeof factors.precipitationScore !== 'number' ||
    !Number.isFinite(factors.precipitationScore) ||
    factors.precipitationScore < 0 ||
    factors.precipitationScore > 40 ||
    typeof factors.topographyScore !== 'number' ||
    !Number.isFinite(factors.topographyScore) ||
    factors.topographyScore < 0 ||
    factors.topographyScore > 25 ||
    typeof factors.tidalHydraulicScore !== 'number' ||
    !Number.isFinite(factors.tidalHydraulicScore) ||
    factors.tidalHydraulicScore < 0 ||
    factors.tidalHydraulicScore > 20 ||
    typeof factors.surfaceRunoffScore !== 'number' ||
    !Number.isFinite(factors.surfaceRunoffScore) ||
    factors.surfaceRunoffScore < 0 ||
    factors.surfaceRunoffScore > 15
  ) {
    return false;
  }

  if (typeof res.explanation !== 'string' || !res.explanation.trim()) return false;
  if (!Array.isArray(res.precautions) || res.precautions.length === 0) return false;

  if (!res.provenance || typeof res.provenance !== 'object' || Array.isArray(res.provenance)) return false;
  const provenance = res.provenance as Record<string, unknown>;
  if (typeof provenance.engine !== 'string' || !provenance.engine.trim()) return false;
  if (provenance.mode !== 'AWS_LAMBDA') return false;

  return true;
}

export async function requestRiskAssessment(
  location: LocationGeoData,
  params: SimulationParams
): Promise<RiskAssessmentResult> {
  const endpoint = getActiveEndpointUrl();

  // If an API endpoint URL is configured, attempt the server-side Lambda API call
  if (endpoint && endpoint.trim()) {
    const startTime = performance.now();
    try {
      const response = await fetch(`${endpoint.replace(/\/+$/, '')}/assess`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          location,
          params,
        }),
        signal: AbortSignal.timeout(6000),
      });

      if (response.ok) {
        const data = await response.json().catch(() => null);
        const latencyMs = Math.round(performance.now() - startTime);

        // Verify response schema before accepting
        if (isValidAssessmentResponse(data)) {
          // Check explicit server-asserted provenance. Do not claim AWS if the server did not return AWS_LAMBDA.
          if (data.provenance.mode === 'AWS_LAMBDA') {
            return {
              ...data,
              provenance: {
                ...data.provenance,
                executionTimeMs: latencyMs,
                endpointUrl: endpoint,
              },
            };
          } else {
            console.warn(
              '[API Client] Server returned valid schema but mode is not AWS_LAMBDA. Retaining reported mode:',
              data.provenance.mode
            );
            return {
              ...data,
              provenance: {
                ...data.provenance,
                executionTimeMs: latencyMs,
                endpointUrl: endpoint,
              },
            };
          }
        } else {
          console.warn('[API Client] Server returned HTTP 200, but payload failed schema validation. Falling back to local engine.');
        }
      } else {
        console.warn(`[API Client] Server returned HTTP ${response.status}. Using honest local fallback.`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown network failure';
      console.warn('[API Client] Network error reaching endpoint. Using honest local fallback:', msg);
    }
  }

  // Local deterministic fallback: strictly labeled as LOCAL_FALLBACK
  return calculateFloodRisk(location, params, 'LOCAL_FALLBACK', endpoint || undefined);
}

export async function checkAwsHealth(): Promise<ApiStatus> {
  const endpoint = getActiveEndpointUrl();

  if (!endpoint || !endpoint.trim()) {
    return {
      isAwsLive: false,
      endpointUrl: 'No AWS Endpoint Configured (VITE_AWS_API_URL empty)',
      lastChecked: new Date().toLocaleTimeString('en-IN'),
      error: 'Using local in-browser deterministic heuristic engine.',
    };
  }

  const start = performance.now();
  try {
    const response = await fetch(`${endpoint.replace(/\/+$/, '')}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    const latencyMs = Math.round(performance.now() - start);

    if (response.ok) {
      const data = await response.json().catch(() => ({}));
      // Validate that health response contains healthy status
      const isHealthy = data && typeof data === 'object' && data.status === 'healthy';
      return {
        isAwsLive: isHealthy,
        endpointUrl: endpoint,
        latencyMs,
        lastChecked: new Date().toLocaleTimeString('en-IN'),
        engineName: data.service || 'AWS Lambda Node.js 22',
        runtime: typeof data.runtime === 'string' ? data.runtime : undefined,
        error: isHealthy ? undefined : 'Unrecognized health payload format',
      };
    } else {
      return {
        isAwsLive: false,
        endpointUrl: endpoint,
        latencyMs,
        lastChecked: new Date().toLocaleTimeString('en-IN'),
        error: `HTTP ${response.status} from endpoint`,
      };
    }
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error && err.name === 'TimeoutError'
        ? 'Connection timed out (>5s)'
        : err instanceof Error
        ? err.message
        : 'Connection refused';
    return {
      isAwsLive: false,
      endpointUrl: endpoint,
      lastChecked: new Date().toLocaleTimeString('en-IN'),
      error: errorMsg,
    };
  }
}
