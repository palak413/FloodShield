import React from 'react';
import {
  CloudRain,
  Clock,
  Waves,
  Wrench,
  Sparkles,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  HelpCircle,
  Play,
  RotateCcw,
} from 'lucide-react';
import {
  LocationGeoData,
  SimulationParams,
  RiskAssessmentResult,
  TideLevel,
  DrainageCondition,
} from '../types/flood';
import { calculateFloodRisk } from '../services/riskEngine';

interface StormSimulatorProps {
  locations: LocationGeoData[];
  selectedLocation: LocationGeoData;
  onSelectLocation: (loc: LocationGeoData) => void;
  currentParams: SimulationParams;
  onUpdateParams: (params: SimulationParams) => void;
  baselineAssessment: RiskAssessmentResult;
  simulatedAssessment: RiskAssessmentResult;
}

export const StormSimulator: React.FC<StormSimulatorProps> = ({
  locations,
  selectedLocation,
  onSelectLocation,
  currentParams,
  onUpdateParams,
  baselineAssessment,
  simulatedAssessment,
}) => {
  const scoreDelta = simulatedAssessment.totalScore - baselineAssessment.totalScore;

  // Preset Scenarios
  const handleApplyPreset = (
    rain: number,
    duration: number,
    tide: TideLevel,
    drainage: DrainageCondition
  ) => {
    onUpdateParams({
      rainfallMmPerHour: rain,
      durationHours: duration,
      tideLevel: tide,
      drainageCondition: drainage,
    });
  };

  const handleReset = () => {
    onUpdateParams({
      rainfallMmPerHour: 25,
      durationHours: 2,
      tideLevel: 'MID_TIDE',
      drainageCondition: 'STANDARD',
    });
  };

  return (
    <div className="bg-[#0E1726] border border-[#1C2B44] rounded-2xl p-6 shadow-2xl space-y-6">
      {/* Title & Heuristic Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-[#1C2B44]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#00F2FE]" />
              Storm Scenario Simulator
            </h2>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#00F2FE]/10 text-[#00F2FE] border border-[#00F2FE]/30">
              Deterministic Engine
            </span>
          </div>
          <p className="text-xs text-[#94A3B8] mt-1">
            Simulate extreme precipitation and tidal gate scenarios against localized municipal drainage models.
          </p>
        </div>

        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 self-start md:self-auto px-3 py-1.5 rounded-lg bg-[#132035] border border-[#1C2B44] text-xs text-[#94A3B8] hover:text-[#00F2FE] hover:border-[#00F2FE]/30 transition-all cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset to Baseline
        </button>
      </div>

      {/* Preset Scenarios Buttons */}
      <div>
        <div className="text-xs font-semibold text-[#CBD5E1] uppercase tracking-wider mb-2">
          Monsoon Scenario Presets
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            onClick={() => handleApplyPreset(15, 1, 'LOW_TIDE', 'OPTIMAL')}
            className="p-2.5 rounded-xl bg-[#132035] hover:bg-[#182842] border border-[#1C2B44] text-left transition-all hover:border-[#00F2FE]/40 group cursor-pointer"
          >
            <div className="text-xs font-semibold text-white group-hover:text-[#00F2FE]">
              Light Showers
            </div>
            <div className="text-[11px] text-[#94A3B8]">15 mm/h · Low Tide</div>
          </button>

          <button
            onClick={() => handleApplyPreset(40, 2, 'MID_TIDE', 'STANDARD')}
            className="p-2.5 rounded-xl bg-[#132035] hover:bg-[#182842] border border-[#1C2B44] text-left transition-all hover:border-[#00F2FE]/40 group cursor-pointer"
          >
            <div className="text-xs font-semibold text-white group-hover:text-[#00F2FE]">
              Typical July Downpour
            </div>
            <div className="text-[11px] text-[#94A3B8]">40 mm/h · Mid Tide</div>
          </button>

          <button
            onClick={() => handleApplyPreset(50, 3, 'SPRING_HIGH_TIDE', 'STANDARD')}
            className="p-2.5 rounded-xl bg-[#132035] hover:bg-[#182842] border border-[#F59E0B]/30 text-left transition-all hover:border-[#F59E0B] group cursor-pointer"
          >
            <div className="text-xs font-semibold text-white group-hover:text-[#F59E0B]">
              High Tide Lockout
            </div>
            <div className="text-[11px] text-[#94A3B8]">50 mm/h · Tide &gt;4.5m</div>
          </button>

          <button
            onClick={() => handleApplyPreset(85, 4, 'SPRING_HIGH_TIDE', 'SILTED')}
            className="p-2.5 rounded-xl bg-[#132035] hover:bg-[#182842] border border-[#F43F5E]/30 text-left transition-all hover:border-[#F43F5E] group cursor-pointer"
          >
            <div className="text-xs font-semibold text-white group-hover:text-[#F43F5E]">
              Severe Cloudburst
            </div>
            <div className="text-[11px] text-[#94A3B8]">85 mm/h · Silted Drains</div>
          </button>
        </div>
      </div>

      {/* Interactive Controls & Sliders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-[#09111F]/70 p-5 rounded-xl border border-[#1C2B44]">
        {/* Rainfall Intensity Slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-medium text-white flex items-center gap-1.5">
              <CloudRain className="w-4 h-4 text-[#00F2FE]" />
              Rainfall Intensity
            </span>
            <span className="font-mono text-base font-bold text-[#00F2FE]">
              {currentParams.rainfallMmPerHour}{' '}
              <span className="text-xs font-normal text-[#94A3B8]">mm / hour</span>
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="120"
            step="5"
            value={currentParams.rainfallMmPerHour}
            onChange={(e) =>
              onUpdateParams({
                ...currentParams,
                rainfallMmPerHour: parseInt(e.target.value, 10),
              })
            }
            className="w-full h-2 bg-[#1C2B44] rounded-lg appearance-none cursor-pointer accent-[#00F2FE]"
          />
          <div className="flex justify-between text-[10px] text-[#94A3B8] font-mono">
            <span>0 mm/h (Dry)</span>
            <span>25 mm/h (BMC Cap)</span>
            <span>65 mm/h (Heavy)</span>
            <span>120 mm/h (Extreme)</span>
          </div>
        </div>

        {/* Rainfall Duration Slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-medium text-white flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#00F2FE]" />
              Rainfall Duration
            </span>
            <span className="font-mono text-base font-bold text-[#00F2FE]">
              {currentParams.durationHours}{' '}
              <span className="text-xs font-normal text-[#94A3B8]">hours</span>
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="24"
            step="1"
            value={currentParams.durationHours}
            onChange={(e) =>
              onUpdateParams({
                ...currentParams,
                durationHours: parseInt(e.target.value, 10),
              })
            }
            className="w-full h-2 bg-[#1C2B44] rounded-lg appearance-none cursor-pointer accent-[#00F2FE]"
          />
          <div className="flex justify-between text-[10px] text-[#94A3B8] font-mono">
            <span>1 hr</span>
            <span>6 hrs</span>
            <span>12 hrs</span>
            <span>24 hrs</span>
          </div>
        </div>

        {/* Arabian Sea Tide Level */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-white flex items-center gap-1.5">
            <Waves className="w-4 h-4 text-[#00F2FE]" />
            Arabian Sea Tide Phase
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'LOW_TIDE', label: 'Low Tide (<2m)', sub: 'Gates open' },
              { id: 'MID_TIDE', label: 'Mid Tide (2.5m)', sub: 'Partial' },
              { id: 'SPRING_HIGH_TIDE', label: 'Spring (>4.5m)', sub: 'Gates closed' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() =>
                  onUpdateParams({
                    ...currentParams,
                    tideLevel: t.id as TideLevel,
                  })
                }
                className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                  currentParams.tideLevel === t.id
                    ? 'bg-[#1C2B44] border-[#00F2FE] text-white shadow-[0_0_10px_rgba(0,242,254,0.15)]'
                    : 'bg-[#132035] border-[#1C2B44] text-[#94A3B8] hover:border-[#283D62]'
                }`}
              >
                <div className="text-xs font-semibold">{t.label}</div>
                <div className="text-[10px] text-[#94A3B8]">{t.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Drainage Condition */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-white flex items-center gap-1.5">
            <Wrench className="w-4 h-4 text-[#00F2FE]" />
            Drainage & Pump Condition
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'OPTIMAL', label: 'Optimal', sub: 'Pumps active' },
              { id: 'STANDARD', label: 'Standard', sub: 'Normal season' },
              { id: 'SILTED', label: 'Degraded', sub: 'Culverts choked' },
            ].map((d) => (
              <button
                key={d.id}
                onClick={() =>
                  onUpdateParams({
                    ...currentParams,
                    drainageCondition: d.id as DrainageCondition,
                  })
                }
                className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                  currentParams.drainageCondition === d.id
                    ? 'bg-[#1C2B44] border-[#00F2FE] text-white shadow-[0_0_10px_rgba(0,242,254,0.15)]'
                    : 'bg-[#132035] border-[#1C2B44] text-[#94A3B8] hover:border-[#283D62]'
                }`}
              >
                <div className="text-xs font-semibold">{d.label}</div>
                <div className="text-[10px] text-[#94A3B8]">{d.sub}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Side-by-Side Comparison Matrix */}
      <div>
        <div className="text-xs font-semibold text-[#CBD5E1] uppercase tracking-wider mb-3">
          Side-by-Side Scenario Impact Analysis
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Baseline Scenario */}
          <div className="p-4 rounded-xl bg-[#132035]/60 border border-[#1C2B44]">
            <div className="flex items-center justify-between pb-2 border-b border-[#1C2B44]">
              <span className="text-xs font-semibold text-[#94A3B8] uppercase">Baseline Benchmark</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1C2B44] text-[#CBD5E1]">
                25 mm/h · 2h
              </span>
            </div>
            <div className="flex items-center justify-between my-3">
              <div>
                <div className="text-2xl font-extrabold font-mono text-white">
                  {baselineAssessment.totalScore}
                  <span className="text-xs text-[#94A3B8] font-normal"> / 100</span>
                </div>
                <div className="text-xs font-medium text-[#94A3B8] uppercase">
                  {baselineAssessment.category} Risk
                </div>
              </div>
              <div
                className={`w-3.5 h-3.5 rounded-full ${
                  baselineAssessment.category === 'HIGH'
                    ? 'bg-[#F43F5E]'
                    : baselineAssessment.category === 'MODERATE'
                    ? 'bg-[#F59E0B]'
                    : 'bg-[#00F2FE]'
                }`}
              />
            </div>
            <p className="text-[11px] text-[#94A3B8] line-clamp-2">
              {baselineAssessment.explanation}
            </p>
          </div>

          {/* User-Adjusted Scenario */}
          <div className="p-4 rounded-xl bg-[#132035] border border-[#00F2FE]/40 relative overflow-hidden">
            <div className="flex items-center justify-between pb-2 border-b border-[#1C2B44]">
              <span className="text-xs font-semibold text-[#00F2FE] uppercase flex items-center gap-1.5">
                Adjusted Scenario
              </span>
              <div
                className={`flex items-center gap-1 text-xs font-mono font-bold px-2 py-0.5 rounded ${
                  scoreDelta > 0
                    ? 'bg-[#F43F5E]/20 text-[#F43F5E] border border-[#F43F5E]/40'
                    : scoreDelta < 0
                    ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40'
                    : 'bg-[#1C2B44] text-[#94A3B8]'
                }`}
              >
                {scoreDelta > 0 ? (
                  <>
                    <TrendingUp className="w-3.5 h-3.5" />
                    +{scoreDelta} Pts
                  </>
                ) : scoreDelta < 0 ? (
                  <>
                    <TrendingDown className="w-3.5 h-3.5" />
                    {scoreDelta} Pts
                  </>
                ) : (
                  <>
                    <Minus className="w-3.5 h-3.5" />
                    0 Pts
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between my-3">
              <div>
                <div className="text-2xl font-extrabold font-mono text-white">
                  {simulatedAssessment.totalScore}
                  <span className="text-xs text-[#94A3B8] font-normal"> / 100</span>
                </div>
                <div className="text-xs font-medium text-[#00F2FE] uppercase">
                  {simulatedAssessment.category} Risk
                </div>
              </div>
              <div
                className={`w-3.5 h-3.5 rounded-full ${
                  simulatedAssessment.category === 'HIGH'
                    ? 'bg-[#F43F5E] shadow-[0_0_8px_#F43F5E]'
                    : simulatedAssessment.category === 'MODERATE'
                    ? 'bg-[#F59E0B] shadow-[0_0_8px_#F59E0B]'
                    : 'bg-[#00F2FE] shadow-[0_0_8px_#00F2FE]'
                }`}
              />
            </div>
            <p className="text-[11px] text-[#CBD5E1] line-clamp-2">
              {simulatedAssessment.explanation}
            </p>
          </div>
        </div>
      </div>

      {/* Transparent Disclaimer */}
      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#09111F] border border-[#1C2B44] text-[11px] text-[#94A3B8]">
        <AlertCircle className="w-4 h-4 text-[#00F2FE] shrink-0 mt-0.5" />
        <div>
          <strong className="text-white">Heuristic Simulation Notice:</strong> This simulator illustrates relative susceptibility under municipal flood mechanics (BMC capacity, elevation saucer depth, tidal lockout). It is designed to assist urban planning and emergency precaution decisions, not to claim hydrodynamic sensor telemetry.
        </div>
      </div>
    </div>
  );
};
