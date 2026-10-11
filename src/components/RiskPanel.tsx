import React from 'react';
import {
  AlertTriangle,
  CheckCircle,
  AlertOctagon,
  CloudRain,
  Mountain,
  Waves,
  Footprints,
  Compass,
  Clock,
  Shield,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { LocationGeoData, RiskAssessmentResult } from '../types/flood';

interface RiskPanelProps {
  location: LocationGeoData;
  assessment: RiskAssessmentResult;
  onOpenAwsInspector: () => void;
}

export const RiskPanel: React.FC<RiskPanelProps> = ({
  location,
  assessment,
  onOpenAwsInspector,
}) => {
  const { totalScore, category, factors, inputParameters, explanation, precautions, provenance } =
    assessment;

  let categoryBadgeClass = 'bg-[#F43F5E]/20 text-[#F43F5E] border-[#F43F5E]/50';
  let categoryIcon = <AlertOctagon className="w-5 h-5 text-[#F43F5E]" />;
  let categoryLabel = 'HIGH RISK';
  let gaugeColor = '#F43F5E';

  if (category === 'LOW') {
    categoryBadgeClass = 'bg-[#00F2FE]/20 text-[#00F2FE] border-[#00F2FE]/50';
    categoryIcon = <CheckCircle className="w-5 h-5 text-[#00F2FE]" />;
    categoryLabel = 'LOW RISK';
    gaugeColor = '#00F2FE';
  } else if (category === 'MODERATE') {
    categoryBadgeClass = 'bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]/50';
    categoryIcon = <AlertTriangle className="w-5 h-5 text-[#F59E0B]" />;
    categoryLabel = 'MODERATE RISK';
    gaugeColor = '#F59E0B';
  }

  // Circular gauge math (radius 48, circumference ~ 301.6)
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (totalScore / 100) * circumference;

  return (
    <div className="bg-[#0E1726] border border-[#1C2B44] rounded-2xl p-5 shadow-2xl flex flex-col justify-between h-full">
      {/* Top Header */}
      <div>
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#1C2B44]">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight">{location.name}</h2>
              <span className="text-xs px-2 py-0.5 rounded bg-[#1C2B44] text-[#00F2FE] font-mono">
                {location.ward}
              </span>
            </div>
            <p className="text-xs text-[#94A3B8] mt-0.5">{location.marathiName}</p>
          </div>
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold tracking-wider uppercase font-mono ${categoryBadgeClass}`}
          >
            {categoryIcon}
            <span>{categoryLabel}</span>
          </div>
        </div>

        {/* Hero Score & Gauge Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center my-4 p-4 rounded-xl bg-[#09111F]/60 border border-[#1C2B44]">
          {/* Circular SVG Gauge */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative w-28 h-28 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="56"
                  cy="56"
                  r={radius}
                  stroke="#1C2B44"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="56"
                  cy="56"
                  r={radius}
                  stroke={gaugeColor}
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-extrabold text-white font-mono tracking-tight">
                  {totalScore}
                </span>
                <span className="text-[10px] text-[#94A3B8] uppercase font-mono tracking-wider">
                  / 100 Index
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="sm:col-span-2 space-y-2 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-[#1C2B44]/60">
              <span className="text-[#94A3B8] flex items-center gap-1.5">
                <CloudRain className="w-3.5 h-3.5 text-[#00F2FE]" />
                Simulated Rain
              </span>
              <span className="font-mono font-semibold text-white">
                {inputParameters.rainfallMmPerHour} mm/h ({inputParameters.durationHours}h)
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-[#1C2B44]/60">
              <span className="text-[#94A3B8] flex items-center gap-1.5">
                <Waves className="w-3.5 h-3.5 text-[#00F2FE]" />
                Arabian Sea Tide
              </span>
              <span className="font-mono font-semibold text-white">
                {inputParameters.tideLevel === 'SPRING_HIGH_TIDE'
                  ? 'Spring High Tide (>4.5m)'
                  : inputParameters.tideLevel === 'MID_TIDE'
                  ? 'Mid Tide (2.5m)'
                  : 'Low Tide (<2.0m)'}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-[#1C2B44]/60">
              <span className="text-[#94A3B8] flex items-center gap-1.5">
                <Mountain className="w-3.5 h-3.5 text-[#00F2FE]" />
                Depression / Elevation
              </span>
              <span className="font-mono font-semibold text-white">
                {location.depressionIndex}/10 dip · {location.elevationMeters}m elev
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-[#94A3B8] flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-[#00F2FE]" />
                Holding Tank
              </span>
              <span className="font-mono font-semibold text-white">
                {location.holdingTankPresent ? 'Active (Underground Tank)' : 'None'}
              </span>
            </div>
          </div>
        </div>

        {/* Contributing Factors Breakdown */}
        <div className="my-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-white">
              Contributing Factors
            </span>
            <span className="text-[10px] text-[#94A3B8] font-mono">Weighted Heuristic Components</span>
          </div>

          <div className="space-y-2">
            {/* Precipitation Load */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#CBD5E1] flex items-center gap-1.5">
                  <CloudRain className="w-3.5 h-3.5 text-[#00F2FE]" />
                  Precipitation Overload
                </span>
                <span className="font-mono text-[#00F2FE] font-bold">
                  {factors.precipitationScore} <span className="text-[#94A3B8] font-normal">/ 40</span>
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#1C2B44] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#00F2FE] to-[#00C2FF] transition-all duration-500 rounded-full"
                  style={{ width: `${(factors.precipitationScore / 40) * 100}%` }}
                />
              </div>
            </div>

            {/* Topography Vulnerability */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#CBD5E1] flex items-center gap-1.5">
                  <Mountain className="w-3.5 h-3.5 text-[#F59E0B]" />
                  Topographical Saucer Depth
                </span>
                <span className="font-mono text-[#F59E0B] font-bold">
                  {factors.topographyScore} <span className="text-[#94A3B8] font-normal">/ 25</span>
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#1C2B44] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#F59E0B] transition-all duration-500 rounded-full"
                  style={{ width: `${(factors.topographyScore / 25) * 100}%` }}
                />
              </div>
            </div>

            {/* Tidal & Hydraulic Resistance */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#CBD5E1] flex items-center gap-1.5">
                  <Waves className="w-3.5 h-3.5 text-[#F43F5E]" />
                  Tidal Outfall Closure
                </span>
                <span className="font-mono text-[#F43F5E] font-bold">
                  {factors.tidalHydraulicScore} <span className="text-[#94A3B8] font-normal">/ 20</span>
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#1C2B44] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#F43F5E] transition-all duration-500 rounded-full"
                  style={{ width: `${(factors.tidalHydraulicScore / 20) * 100}%` }}
                />
              </div>
            </div>

            {/* Surface Runoff */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#CBD5E1] flex items-center gap-1.5">
                  <Footprints className="w-3.5 h-3.5 text-[#94A3B8]" />
                  Impervious Runoff Ratio
                </span>
                <span className="font-mono text-white font-bold">
                  {factors.surfaceRunoffScore} <span className="text-[#94A3B8] font-normal">/ 15</span>
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#1C2B44] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#94A3B8] transition-all duration-500 rounded-full"
                  style={{ width: `${(factors.surfaceRunoffScore / 15) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Explanation Synthesis */}
        <div className="p-3 bg-[#09111F] border border-[#1C2B44] rounded-xl text-xs text-[#CBD5E1] leading-relaxed my-3">
          <div className="flex items-center gap-1.5 text-white font-semibold mb-1">
            <Compass className="w-3.5 h-3.5 text-[#00F2FE]" />
            Risk Rationale
          </div>
          {explanation}
        </div>

        {/* 3 Practical Precautionary Recommendations */}
        <div className="my-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-white mb-2">
            Recommended Actionable Precautions
          </div>
          <div className="space-y-2">
            {precautions.map((p, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 p-2.5 rounded-lg bg-[#132035]/60 border border-[#1C2B44] text-xs text-[#F1F5F9]"
              >
                <div className="w-5 h-5 rounded-full bg-[#00F2FE]/10 border border-[#00F2FE]/30 flex items-center justify-center shrink-0 mt-0.5 text-[#00F2FE] font-bold text-[10px] font-mono">
                  {idx + 1}
                </div>
                <div className="leading-snug">{p}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Provenance & Disclaimer Footer */}
      <div className="pt-3 border-t border-[#1C2B44] mt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-[#94A3B8]">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#00F2FE]" />
            <span>Engine:</span>
            <span className="font-mono text-white text-[11px]">{provenance.engine}</span>
          </div>
          {provenance.mode === 'AWS_LAMBDA' ? (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
              LIVE AWS ({provenance.executionTimeMs ?? 15}ms)
            </span>
          ) : (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-[#00F2FE]/10 text-[#00F2FE] border border-[#00F2FE]/30">
              OFFLINE / LOCAL FALLBACK
            </span>
          )}
        </div>
        <button
          onClick={onOpenAwsInspector}
          className="text-[#00F2FE] hover:underline flex items-center gap-1 text-[11px] cursor-pointer shrink-0"
        >
          Inspect API Contract <ExternalLink className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
