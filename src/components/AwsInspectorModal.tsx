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
} from 'lucide-react';
import { ApiStatus } from '../services/api';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-[#FFFFFF] border border-[#DDE3D8] rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#DDE3D8] bg-[#F7F8F4] sticky top-0 z-10 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#E5EBDD] border border-[#DDE3D8] flex items-center justify-center text-[#45664F]">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#344638] flex items-center gap-2">
                AWS Serverless Integration & Verification
                <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-[#E5EBDD] text-[#45664F] font-semibold border border-[#DDE3D8]">
                  ap-south-1
                </span>
              </h3>
              <p className="text-xs text-[#737F71]">
                Real-time API Gateway contract, Lambda execution latency & architecture.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#737F71] hover:text-[#344638] p-1.5 rounded-lg hover:bg-[#E5EBDD] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-6 text-xs">
          {/* Architecture Pipeline Banner */}
          <div className="p-4 rounded-xl bg-[#F7F8F4] border border-[#DDE3D8] space-y-3">
            <div className="text-xs font-bold text-[#344638] uppercase tracking-wider flex items-center gap-2">
              <Cloud className="w-4 h-4 text-[#45664F]" />
              Production AWS Architecture Flow
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-center">
              <div className="p-2.5 rounded-lg bg-[#FFFFFF] border border-[#DDE3D8] flex-1 min-w-[120px] shadow-2xs">
                <div className="text-[10px] text-[#737F71]">Frontend</div>
                <div className="font-bold text-[#344638] mt-0.5">S3 + CloudFront</div>
                <div className="text-[9px] text-[#45664F] font-mono">React 19 / Vite</div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#737F71] hidden sm:block" />
              <div className="p-2.5 rounded-lg bg-[#FFFFFF] border border-[#DDE3D8] flex-1 min-w-[120px] shadow-2xs">
                <div className="text-[10px] text-[#737F71]">Ingress</div>
                <div className="font-bold text-[#344638] mt-0.5">API Gateway HTTP API</div>
                <div className="text-[9px] text-[#45664F] font-mono">CORS / Routing</div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#737F71] hidden sm:block" />
              <div className="p-2.5 rounded-lg bg-[#FFFFFF] border border-[#DDE3D8] flex-1 min-w-[120px] shadow-2xs">
                <div className="text-[10px] text-[#737F71]">Compute</div>
                <div className="font-bold text-[#344638] mt-0.5">AWS Lambda Node 22</div>
                <div className="text-[9px] text-[#45664F] font-mono">Heuristic Engine</div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#737F71] hidden sm:block" />
              <div className="p-2.5 rounded-lg bg-[#FFFFFF] border border-[#DDE3D8] flex-1 min-w-[120px] shadow-2xs">
                <div className="text-[10px] text-[#737F71]">Telemetry</div>
                <div className="font-bold text-[#344638] mt-0.5">Open-Meteo</div>
                <div className="text-[9px] text-[#45664F] font-mono">Mumbai Weather</div>
              </div>
            </div>
          </div>

          {/* Interactive Live Endpoint Tester */}
          <div className="p-4 rounded-xl bg-[#F7F8F4] border border-[#DDE3D8] space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#344638] text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Code className="w-4 h-4 text-[#45664F]" />
                Live Endpoint Verification Test
              </span>
              <button
                onClick={handleCopySampleCurl}
                className="text-[11px] text-[#45664F] hover:underline flex items-center gap-1 cursor-pointer font-medium"
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
                className="flex-1 bg-[#FFFFFF] border border-[#DDE3D8] rounded-lg px-3 py-2 text-[#344638] font-mono text-xs focus:outline-none focus:border-[#45664F] shadow-2xs"
              />
              <button
                onClick={handleRunVerification}
                disabled={isTesting}
                className="px-4 py-2 bg-[#45664F] hover:bg-[#344638] text-white font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                {isTesting ? 'Pinging...' : 'Verify'}
              </button>
            </div>

            {testError && (
              <div className="p-3 rounded-lg bg-[#C87868]/10 border border-[#C87868]/30 text-[#C87868] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>
                  <strong>Connection Error:</strong> {testError}. Ensure local Lambda emulator is running (`npm run api:dev`) or cloud endpoint is active.
                </span>
              </div>
            )}

            {testResponse && (
              <div className="p-3 rounded-lg bg-[#FFFFFF] border border-[#45664F]/40 space-y-2 shadow-2xs">
                <div className="flex items-center justify-between text-xs pb-1.5 border-b border-[#DDE3D8]">
                  <span className="text-[#45664F] font-bold flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Response 200 OK
                  </span>
                  <span className="font-mono text-[#45664F] font-semibold">
                    Latency: {testResponse.latencyMs} ms
                  </span>
                </div>
                <div className="font-mono text-[11px] text-[#556353] max-h-48 overflow-y-auto bg-[#F7F8F4] p-2.5 rounded border border-[#DDE3D8]">
                  <pre>{JSON.stringify(testResponse.payload, null, 2)}</pre>
                </div>
              </div>
            )}
          </div>

          {/* Infrastructure As Code Reference */}
          <div className="p-4 rounded-xl bg-[#F7F8F4] border border-[#DDE3D8] space-y-2">
            <div className="text-xs font-bold text-[#344638] flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-[#45664F]" />
              AWS SAM Template Spec (`infra/template.yaml`)
            </div>
            <div className="font-mono text-[10px] text-[#556353] bg-[#FFFFFF] p-3 rounded border border-[#DDE3D8] leading-relaxed shadow-2xs">
              <div>Transform: AWS::Serverless-2016-10-31</div>
              <div>Region: ap-south-1 (Mumbai)</div>
              <div>Runtime: nodejs22.x (arm64 Graviton)</div>
              <div>Handler: backend/lambda/handler.handler</div>
              <div>Routes: POST /assess, GET /health</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#DDE3D8] bg-[#F7F8F4] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#E5EBDD] hover:bg-[#D8E2CE] text-[#344638] font-semibold text-xs transition-colors cursor-pointer"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
