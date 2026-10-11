import React, { useState } from 'react';
import {
  X,
  Server,
  Cloud,
  CheckCircle,
  AlertCircle,
  Play,
  Copy,
  Layers,
  ArrowRight,
  Code,
  ShieldAlert,
} from 'lucide-react';
import { ApiStatus, checkAwsHealth } from '../services/api';
import { MUMBAI_LOCATIONS } from '../data/mumbaiLocations';

interface AwsInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiStatus: ApiStatus;
  onRefreshStatus: () => void;
}

export const AwsInspectorModal: React.FC<AwsInspectorModalProps> = ({
  isOpen,
  onClose,
  apiStatus,
  onRefreshStatus,
}) => {
  const [testEndpoint, setTestEndpoint] = useState(
    apiStatus.endpointUrl.startsWith('http') ? apiStatus.endpointUrl : 'http://localhost:5001'
  );
  const [isTesting, setIsTesting] = useState(false);
  const [testResponse, setTestResponse] = useState<any>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleRunVerification = async () => {
    setIsTesting(true);
    setTestError(null);
    setTestResponse(null);

    const testPayload = {
      location: MUMBAI_LOCATIONS[0],
      params: {
        rainfallMmPerHour: 55,
        durationHours: 3,
        tideLevel: 'SPRING_HIGH_TIDE',
        drainageCondition: 'STANDARD',
      },
    };

    const start = performance.now();
    try {
      const res = await fetch(`${testEndpoint}/assess`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPayload),
      });

      const latencyMs = Math.round(performance.now() - start);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      setTestResponse({
        httpStatus: res.status,
        latencyMs,
        headers: {
          'content-type': res.headers.get('content-type') || 'application/json',
          'access-control-allow-origin': res.headers.get('access-control-allow-origin') || '*',
        },
        payload: data,
      });
      onRefreshStatus();
    } catch (err: any) {
      setTestError(err.message || 'Failed to connect');
    } finally {
      setIsTesting(false);
    }
  };

  const handleCopySampleCurl = () => {
    const curlCmd = `curl -X POST "${testEndpoint}/assess" \\
  -H "Content-Type: application/json" \\
  -d '{"location":{"id":"milan-subway","name":"Milan Subway","elevationMeters":3.8,"depressionIndex":10,"proximityToWaterwayMeters":1600,"imperviousRatio":0.95},"params":{"rainfallMmPerHour":60,"durationHours":2,"tideLevel":"SPRING_HIGH_TIDE","drainageCondition":"STANDARD"}}'`;
    navigator.clipboard.writeText(curlCmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0E1726] border border-[#283D62] rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#1C2B44] bg-[#09111F]/80 sticky top-0 z-10 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#00F2FE]/10 border border-[#00F2FE]/40 flex items-center justify-center text-[#00F2FE]">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                AWS Serverless Integration & Verification
                <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-[#1C2B44] text-[#00F2FE]">
                  ap-south-1
                </span>
              </h3>
              <p className="text-xs text-[#94A3B8]">
                Real-time API Gateway contract, Lambda execution latency & architecture.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#94A3B8] hover:text-white p-1 rounded-lg hover:bg-[#1C2B44] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-6 text-xs">
          {/* Architecture Pipeline Banner */}
          <div className="p-4 rounded-xl bg-[#09111F] border border-[#1C2B44] space-y-3">
            <div className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
              <Cloud className="w-4 h-4 text-[#00F2FE]" />
              Production AWS Architecture Flow
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-center">
              <div className="p-2.5 rounded-lg bg-[#132035] border border-[#1C2B44] flex-1 min-w-[120px]">
                <div className="text-[10px] text-[#94A3B8]">Frontend</div>
                <div className="font-bold text-white mt-0.5">S3 + CloudFront</div>
                <div className="text-[9px] text-[#00F2FE] font-mono">React 19 / Vite</div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#94A3B8] hidden sm:block" />
              <div className="p-2.5 rounded-lg bg-[#132035] border border-[#1C2B44] flex-1 min-w-[120px]">
                <div className="text-[10px] text-[#94A3B8]">Ingress</div>
                <div className="font-bold text-white mt-0.5">API Gateway HTTP API</div>
                <div className="text-[9px] text-[#00F2FE] font-mono">CORS / Routing</div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#94A3B8] hidden sm:block" />
              <div className="p-2.5 rounded-lg bg-[#132035] border border-[#1C2B44] flex-1 min-w-[120px]">
                <div className="text-[10px] text-[#94A3B8]">Compute</div>
                <div className="font-bold text-white mt-0.5">AWS Lambda Node 20</div>
                <div className="text-[9px] text-[#00F2FE] font-mono">Heuristic Engine</div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#94A3B8] hidden sm:block" />
              <div className="p-2.5 rounded-lg bg-[#132035] border border-[#1C2B44] flex-1 min-w-[120px]">
                <div className="text-[10px] text-[#94A3B8]">Telemetry</div>
                <div className="font-bold text-white mt-0.5">Open-Meteo</div>
                <div className="text-[9px] text-[#00F2FE] font-mono">Mumbai Weather</div>
              </div>
            </div>
          </div>

          {/* Interactive Live Endpoint Tester */}
          <div className="p-4 rounded-xl bg-[#132035]/60 border border-[#1C2B44] space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Code className="w-4 h-4 text-[#00F2FE]" />
                Live Endpoint Verification Test
              </span>
              <button
                onClick={handleCopySampleCurl}
                className="text-[11px] text-[#00F2FE] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Copy className="w-3 h-3" />
                {copied ? 'Copied cURL!' : 'Copy cURL Command'}
              </button>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={testEndpoint}
                onChange={(e) => setTestEndpoint(e.target.value)}
                placeholder="https://xxx.execute-api.ap-south-1.amazonaws.com or http://localhost:5001"
                className="flex-1 bg-[#09111F] border border-[#1C2B44] rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-[#00F2FE]"
              />
              <button
                onClick={handleRunVerification}
                disabled={isTesting}
                className="px-4 py-2 bg-[#00F2FE] hover:bg-[#00C2FF] text-[#09111F] font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                {isTesting ? 'Pinging...' : 'Verify'}
              </button>
            </div>

            {testError && (
              <div className="p-3 rounded-lg bg-[#F43F5E]/10 border border-[#F43F5E]/30 text-[#F43F5E] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>
                  <strong>Connection Error:</strong> {testError}. Ensure local Lambda emulator is running (`npm run api:dev`) or cloud endpoint is active.
                </span>
              </div>
            )}

            {testResponse && (
              <div className="p-3 rounded-lg bg-[#09111F] border border-[#10B981]/40 space-y-2">
                <div className="flex items-center justify-between text-xs pb-1.5 border-b border-[#1C2B44]">
                  <span className="text-[#10B981] font-bold flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Response 200 OK
                  </span>
                  <span className="font-mono text-[#00F2FE]">
                    Latency: {testResponse.latencyMs} ms
                  </span>
                </div>
                <div className="font-mono text-[11px] text-[#94A3B8] max-h-48 overflow-y-auto bg-[#050A14] p-2.5 rounded border border-[#1C2B44]">
                  <pre>{JSON.stringify(testResponse.payload, null, 2)}</pre>
                </div>
              </div>
            )}
          </div>

          {/* Infrastructure As Code Reference */}
          <div className="p-4 rounded-xl bg-[#09111F] border border-[#1C2B44] space-y-2">
            <div className="text-xs font-semibold text-white flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-[#00F2FE]" />
              AWS SAM Template Spec (`infra/template.yaml`)
            </div>
            <div className="font-mono text-[10px] text-[#94A3B8] bg-[#050A14] p-3 rounded border border-[#1C2B44] leading-relaxed">
              <div>Transform: AWS::Serverless-2016-10-31</div>
              <div>Region: ap-south-1 (Mumbai)</div>
              <div>Runtime: nodejs20.x (arm64 Graviton)</div>
              <div>Handler: backend/lambda/handler.handler</div>
              <div>Routes: POST /assess, GET /health</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#1C2B44] bg-[#09111F]/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#1C2B44] hover:bg-[#283D62] text-white font-medium text-xs transition-colors cursor-pointer"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
