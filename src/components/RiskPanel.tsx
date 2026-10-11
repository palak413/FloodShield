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

  let categoryBadgeClass = 'bg-[#C87868]/15 text-[#C87868] border-[#C87868]/40';
  let categoryIcon = <AlertOctagon className="w-4 h-4 text-[#C87868]" />;
  let categoryLabel = 'HIGH RISK';
  let gaugeColor = '#C87868';

  if (category === 'LOW') {
    categoryBadgeClass = 'bg-[#E5EBDD] text-[#45664F] border-[#45664F]/30';
    categoryIcon = <CheckCircle className="w-4 h-4 text-[#45664F]" />;
    categoryLabel = 'LOW RISK';
    gaugeColor = '#45664F';
  } else if (category === 'MODERATE') {
    categoryBadgeClass = 'bg-[#9E8C58]/15 text-[#9E8C58] border-[#9E8C58]/40';
    categoryIcon = <AlertTriangle className="w-4 h-4 text-[#9E8C58]" />;
    categoryLabel = 'MODERATE RISK';
    gaugeColor = '#9E8C58';
  }

  // Circular gauge math (radius 46, circumference ~ 289)
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (totalScore / 100) * circumference;

  return (
    <div className="bg-[#FFFFFF] border border-[#DDE3D8] rounded-2xl p-5 shadow-xs flex flex-col justify-between h-full">
      {/* Top Header */}
      <div>
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#DDE3D8]">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-[#344638] tracking-tight">{location.name}</h2>
              <span className="text-xs px-2 py-0.5 rounded bg-[#E5EBDD] text-[#45664F] font-mono font-medium">
                {location.ward}
              </span>
            </div>
            <p className="text-xs text-[#737F71] mt-0.5">{location.marathiName}</p>
          </div>
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold tracking-wider uppercase font-mono shadow-2xs ${categoryBadgeClass}`}
          >
            {categoryIcon}
            <span>{categoryLabel}</span>
          </div>
        </div>

        {/* Hero Score & Gauge Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center my-4 p-4 rounded-xl bg-[#F7F8F4] border border-[#DDE3D8]">
          {/* Circular SVG Gauge */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative w-28 h-28 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="56"
                  cy="56"
                  r={radius}
                  stroke="#E5EBDD"
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
                <span className="text-3xl font-extrabold text-[#344638] font-mono tracking-tight">
                  {totalScore}
                </span>
                <span className="text-[10px] text-[#737F71] uppercase font-mono tracking-wider">
                  / 100 Index
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="sm:col-span-2 space-y-2 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-[#DDE3D8]/80">
              <span className="text-[#737F71] flex items-center gap-1.5">
                <CloudRain className="w-3.5 h-3.5 text-[#45664F]" />
                Simulated Rain
              </span>
              <span className="font-mono font-semibold text-[#344638]">
                {inputParameters.rainfallMmPerHour} mm/h ({inputParameters.durationHours}h)
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-[#DDE3D8]/80">
              <span className="text-[#737F71] flex items-center gap-1.5">
                <Waves className="w-3.5 h-3.5 text-[#45664F]" />
                Arabian Sea Tide
              </span>
              <span className="font-mono font-semibold text-[#344638]">
                {inputParameters.tideLevel === 'SPRING_HIGH_TIDE'
                  ? 'Spring High Tide (>4.5m)'
                  : inputParameters.tideLevel === 'MID_TIDE'
                  ? 'Mid Tide (2.5m)'
                  : 'Low Tide (<2.0m)'}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-[#DDE3D8]/80">
              <span className="text-[#737F71] flex items-center gap-1.5">
                <Mountain className="w-3.5 h-3.5 text-[#45664F]" />
                Depression / Elevation
              </span>
              <span className="font-mono font-semibold text-[#344638]">
                {location.depressionIndex}/10 dip · {location.elevationMeters}m elev
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-[#737F71] flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-[#45664F]" />
                Holding Tank
              </span>
              <span className="font-mono font-semibold text-[#344638]">
                {location.holdingTankPresent ? 'Active (Underground Tank)' : 'None'}
              </span>
            </div>
          </div>
        </div>

        {/* Contributing Factors Breakdown */}
        <div className="my-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#344638]">
              Contributing Factors
            </span>
            <span className="text-[10px] text-[#737F71] font-mono">Weighted Heuristic Components</span>
          </div>

          <div className="space-y-2.5">
            {/* Precipitation Load */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#556353] flex items-center gap-1.5 font-medium">
                  <CloudRain className="w-3.5 h-3.5 text-[#45664F]" />
                  Precipitation Overload
                </span>
                <span className="font-mono text-[#45664F] font-bold">
                  {factors.precipitationScore} <span className="text-[#737F71] font-normal">/ 40</span>
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#E5EBDD] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#45664F] transition-all duration-500 rounded-full"
                  style={{ width: `${(factors.precipitationScore / 40) * 100}%` }}
                />
              </div>
            </div>

            {/* Topography Vulnerability */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#556353] flex items-center gap-1.5 font-medium">
                  <Mountain className="w-3.5 h-3.5 text-[#5D8069]" />
                  Topographical Saucer Depth
                </span>
                <span className="font-mono text-[#5D8069] font-bold">
                  {factors.topographyScore} <span className="text-[#737F71] font-normal">/ 25</span>
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#E5EBDD] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#5D8069] transition-all duration-500 rounded-full"
                  style={{ width: `${(factors.topographyScore / 25) * 100}%` }}
                />
              </div>
            </div>

            {/* Tidal & Hydraulic Resistance */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#556353] flex items-center gap-1.5 font-medium">
                  <Waves className="w-3.5 h-3.5 text-[#9E8C58]" />
                  Tidal Outfall Closure
                </span>
                <span className="font-mono text-[#9E8C58] font-bold">
                  {factors.tidalHydraulicScore} <span className="text-[#737F71] font-normal">/ 20</span>
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#E5EBDD] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#9E8C58] transition-all duration-500 rounded-full"
                  style={{ width: `${(factors.tidalHydraulicScore / 20) * 100}%` }}
                />
              </div>
            </div>

            {/* Surface Runoff */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#556353] flex items-center gap-1.5 font-medium">
                  <Footprints className="w-3.5 h-3.5 text-[#737F71]" />
                  Impervious Runoff Ratio
                </span>
                <span className="font-mono text-[#344638] font-bold">
                  {factors.surfaceRunoffScore} <span className="text-[#737F71] font-normal">/ 15</span>
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#E5EBDD] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#737F71] transition-all duration-500 rounded-full"
                  style={{ width: `${(factors.surfaceRunoffScore / 15) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Explanation Synthesis */}
        <div className="p-3 bg-[#F7F8F4] border border-[#DDE3D8] rounded-xl text-xs text-[#556353] leading-relaxed my-3">
          <div className="flex items-center gap-1.5 text-[#344638] font-semibold mb-1">
            <Compass className="w-3.5 h-3.5 text-[#45664F]" />
            Risk Rationale
          </div>
          {explanation}
        </div>

        {/* 3 Practical Precautionary Recommendations */}
        <div className="my-3">
          <div className="text-xs font-bold uppercase tracking-wider text-[#344638] mb-2">
            Recommended Actionable Precautions
          </div>
          <div className="space-y-2">
            {precautions.map((p, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 p-2.5 rounded-lg bg-[#FFFFFF] border border-[#DDE3D8] text-xs text-[#344638] shadow-2xs"
              >
                <div className="w-5 h-5 rounded-full bg-[#E5EBDD] border border-[#DDE3D8] flex items-center justify-center shrink-0 mt-0.5 text-[#45664F] font-bold text-[10px] font-mono">
                  {idx + 1}
                </div>
                <div className="leading-snug text-[#405143]">{p}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Provenance & Disclaimer Footer */}
      <div className="pt-3 border-t border-[#DDE3D8] mt-2 space-y-2">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-[#737F71]">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#45664F]" />
              <span>Engine:</span>
              <span className="font-mono text-[#344638] text-[11px] font-medium">{provenance.engine}</span>
            </div>
            {provenance.mode === 'AWS_LAMBDA' ? (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#E5EBDD] text-[#45664F] border border-[#45664F]/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#45664F] animate-pulse" />
                AWS LAMBDA ({provenance.executionTimeMs ?? 15}ms)
              </span>
            ) : provenance.mode === 'SAMPLE_DATA' ? (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-[#9E8C58]/15 text-[#9E8C58] border border-[#9E8C58]/30">
                SAMPLE-DATA ASSESSMENT
              </span>
            ) : provenance.mode === 'UNAVAILABLE' ? (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-[#C87868]/15 text-[#C87868] border border-[#C87868]/30">
                UNAVAILABLE ASSESSMENT
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-[#F7F8F4] text-[#737F71] border border-[#DDE3D8]">
                LOCAL FALLBACK ASSESSMENT
              </span>
            )}
          </div>
          <button
            onClick={onOpenAwsInspector}
            className="text-[#45664F] hover:underline flex items-center gap-1 text-[11px] cursor-pointer shrink-0 font-medium"
          >
            Inspect API Contract <ExternalLink className="w-3 h-3" />
          </button>
        </div>

        <div className="text-[10px] text-[#737F71] leading-tight">
          Disclaimer: Deterministic heuristic score based on BMC BRIMSTOWAD benchmarks (25–50 mm/h). Not a hydrodynamic gauge sensor or validated safe transit guarantee.
        </div>
      </div>
    </div>
  );
};
