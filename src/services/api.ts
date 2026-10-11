import {
  LocationGeoData,
  SimulationParams,
  RiskAssessmentResult,
} from '../types/flood';
import { calculateFloodRisk } from './riskEngine';

// Configurable via Vite environment variable (e.g. .env or VITE_AWS_API_URL)
const AWS_ENDPOINT_URL =
  import.meta.env.VITE_AWS_API_URL || '';

export interface ApiStatus {
  isAwsLive: boolean;
  endpointUrl: string;
  latencyMs?: number;
  lastChecked: string;
  error?: string;
}

export async function requestRiskAssessment(
  location: LocationGeoData,
  params: SimulationParams
): Promise<RiskAssessmentResult> {
  // If AWS endpoint URL is configured, attempt AWS Lambda API call
  if (AWS_ENDPOINT_URL) {
    const startTime = performance.now();
    try {
      const response = await fetch(`${AWS_ENDPOINT_URL}/assess`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          location,
          params,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const latencyMs = Math.round(performance.now() - startTime);
        return {
          ...data,
          provenance: {
            ...data.provenance,
            mode: 'AWS_LAMBDA',
            executionTimeMs: latencyMs,
            endpointUrl: AWS_ENDPOINT_URL,
          },
        };
      } else {
        console.warn(`AWS Lambda HTTP error: ${response.status}. Falling back to local engine.`);
      }
    } catch (err) {
      console.warn('Network error reaching AWS Lambda endpoint. Using local fallback.', err);
    }
  }

  // Local deterministic fallback
  // Note: We transparently mark provenance mode as 'LOCAL_FALLBACK'
  return calculateFloodRisk(location, params, 'LOCAL_FALLBACK', AWS_ENDPOINT_URL);
}

export async function checkAwsHealth(): Promise<ApiStatus> {
  if (!AWS_ENDPOINT_URL) {
    return {
      isAwsLive: false,
      endpointUrl: 'Not configured (using local deterministic engine)',
      lastChecked: new Date().toLocaleTimeString('en-IN'),
      error: 'VITE_AWS_API_URL not specified',
    };
  }

  const start = performance.now();
  try {
    const response = await fetch(`${AWS_ENDPOINT_URL}/health`, {
      method: 'GET',
    });
    const latencyMs = Math.round(performance.now() - start);
    if (response.ok) {
      return {
        isAwsLive: true,
        endpointUrl: AWS_ENDPOINT_URL,
        latencyMs,
        lastChecked: new Date().toLocaleTimeString('en-IN'),
      };
    } else {
      return {
        isAwsLive: false,
        endpointUrl: AWS_ENDPOINT_URL,
        latencyMs,
        lastChecked: new Date().toLocaleTimeString('en-IN'),
        error: `HTTP ${response.status}`,
      };
    }
  } catch (err: any) {
    return {
      isAwsLive: false,
      endpointUrl: AWS_ENDPOINT_URL,
      lastChecked: new Date().toLocaleTimeString('en-IN'),
      error: err?.message || 'Connection refused',
    };
  }
}
