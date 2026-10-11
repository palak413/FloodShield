import React from 'react';
import {
  CloudRain,
  Clock,
  Waves,
  Wrench,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import {
  LocationGeoData,
  SimulationParams,
  RiskAssessmentResult,
  TideLevel,
  DrainageCondition,
} from '../types/flood';

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
    <div className="bg-[#FFFFFF] border border-[#DDE3D8] rounded-2xl p-6 shadow-xs space-y-6">
      {/* Title & Heuristic Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-[#DDE3D8]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-[#344638] tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#45664F]" />
              Storm Scenario Simulator
            </h2>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-[#E5EBDD] text-[#45664F] border border-[#DDE3D8]">
              Deterministic Engine
            </span>
          </div>
          <p className="text-xs text-[#737F71] mt-1">
            Simulate precipitation and tidal gate scenarios against localized municipal drainage models.
          </p>
        </div>

        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 self-start md:self-auto px-3 py-1.5 rounded-lg bg-[#F7F8F4] border border-[#DDE3D8] text-xs text-[#737F71] hover:text-[#45664F] hover:border-[#45664F]/50 transition-all cursor-pointer font-medium shadow-2xs"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset to Baseline
        </button>
      </div>

      {/* Preset Scenarios Buttons */}
      <div>
        <div className="text-xs font-bold text-[#344638] uppercase tracking-wider mb-2">
          Monsoon Scenario Presets
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            onClick={() => handleApplyPreset(15, 1, 'LOW_TIDE', 'OPTIMAL')}
            className="p-3 rounded-xl bg-[#FFFFFF] hover:bg-[#F7F8F4] border border-[#DDE3D8] text-left transition-all hover:border-[#45664F]/50 group cursor-pointer shadow-2xs"
          >
            <div className="text-xs font-semibold text-[#344638] group-hover:text-[#45664F]">
              Light Showers
            </div>
            <div className="text-[11px] text-[#737F71]">15 mm/h · Low Tide</div>
          </button>

          <button
            onClick={() => handleApplyPreset(40, 2, 'MID_TIDE', 'STANDARD')}
            className="p-3 rounded-xl bg-[#FFFFFF] hover:bg-[#F7F8F4] border border-[#DDE3D8] text-left transition-all hover:border-[#45664F]/50 group cursor-pointer shadow-2xs"
          >
            <div className="text-xs font-semibold text-[#344638] group-hover:text-[#45664F]">
              Typical July Downpour
            </div>
            <div className="text-[11px] text-[#737F71]">40 mm/h · Mid Tide</div>
          </button>

          <button
            onClick={() => handleApplyPreset(50, 3, 'SPRING_HIGH_TIDE', 'STANDARD')}
            className="p-3 rounded-xl bg-[#FFFFFF] hover:bg-[#F7F8F4] border border-[#9E8C58]/40 text-left transition-all hover:border-[#9E8C58] group cursor-pointer shadow-2xs"
          >
            <div className="text-xs font-semibold text-[#344638] group-hover:text-[#9E8C58]">
              High Tide Lockout
            </div>
            <div className="text-[11px] text-[#737F71]">50 mm/h · Tide &gt;4.5m</div>
          </button>

          <button
            onClick={() => handleApplyPreset(85, 4, 'SPRING_HIGH_TIDE', 'SILTED')}
            className="p-3 rounded-xl bg-[#FFFFFF] hover:bg-[#F7F8F4] border border-[#C87868]/40 text-left transition-all hover:border-[#C87868] group cursor-pointer shadow-2xs"
          >
            <div className="text-xs font-semibold text-[#344638] group-hover:text-[#C87868]">
              Severe Cloudburst
            </div>
            <div className="text-[11px] text-[#737F71]">85 mm/h · Silted Drains</div>
          </button>
        </div>
      </div>

      {/* Interactive Controls & Sliders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-[#F7F8F4] p-5 rounded-xl border border-[#DDE3D8]">
        {/* Rainfall Intensity Slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-[#344638] flex items-center gap-1.5">
              <CloudRain className="w-4 h-4 text-[#45664F]" />
              Rainfall Intensity
            </span>
            <span className="font-mono text-base font-bold text-[#45664F]">
              {currentParams.rainfallMmPerHour}{' '}
              <span className="text-xs font-normal text-[#737F71]">mm / hour</span>
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
            className="w-full h-2 bg-[#E5EBDD] rounded-lg appearance-none cursor-pointer accent-[#45664F]"
          />
          <div className="flex justify-between text-[10px] text-[#737F71] font-mono">
            <span>0 mm/h (Dry)</span>
            <span>25 mm/h (BMC Cap)</span>
            <span>65 mm/h (Heavy)</span>
            <span>120 mm/h (Extreme)</span>
          </div>
        </div>

        {/* Rainfall Duration Slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-[#344638] flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#45664F]" />
              Rainfall Duration
            </span>
            <span className="font-mono text-base font-bold text-[#45664F]">
              {currentParams.durationHours}{' '}
              <span className="text-xs font-normal text-[#737F71]">hours</span>
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
            className="w-full h-2 bg-[#E5EBDD] rounded-lg appearance-none cursor-pointer accent-[#45664F]"
          />
          <div className="flex justify-between text-[10px] text-[#737F71] font-mono">
            <span>1 hr</span>
            <span>6 hrs</span>
            <span>12 hrs</span>
            <span>24 hrs</span>
          </div>
        </div>

        {/* Arabian Sea Tide Level */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-[#344638] flex items-center gap-1.5">
            <Waves className="w-4 h-4 text-[#45664F]" />
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
                className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer shadow-2xs ${
                  currentParams.tideLevel === t.id
                    ? 'bg-[#FFFFFF] border-[#45664F] text-[#344638] ring-1 ring-[#45664F]'
                    : 'bg-[#FFFFFF] border-[#DDE3D8] text-[#737F71] hover:border-[#B8C4B3]'
                }`}
              >
                <div className="text-xs font-semibold text-[#344638]">{t.label}</div>
                <div className="text-[10px] text-[#737F71]">{t.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Drainage Condition */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-[#344638] flex items-center gap-1.5">
            <Wrench className="w-4 h-4 text-[#45664F]" />
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
                className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer shadow-2xs ${
                  currentParams.drainageCondition === d.id
                    ? 'bg-[#FFFFFF] border-[#45664F] text-[#344638] ring-1 ring-[#45664F]'
                    : 'bg-[#FFFFFF] border-[#DDE3D8] text-[#737F71] hover:border-[#B8C4B3]'
                }`}
              >
                <div className="text-xs font-semibold text-[#344638]">{d.label}</div>
                <div className="text-[10px] text-[#737F71]">{d.sub}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Side-by-Side Comparison Matrix */}
      <div>
        <div className="text-xs font-bold text-[#344638] uppercase tracking-wider mb-3">
          Side-by-Side Scenario Impact Analysis
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Baseline Scenario */}
          <div className="p-4 rounded-xl bg-[#F7F8F4] border border-[#DDE3D8]">
            <div className="flex items-center justify-between pb-2 border-b border-[#DDE3D8]">
              <span className="text-xs font-bold text-[#737F71] uppercase">Baseline Benchmark</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#E5EBDD] text-[#45664F] font-semibold">
                25 mm/h · 2h
              </span>
            </div>
            <div className="flex items-center justify-between my-3">
              <div>
                <div className="text-2xl font-extrabold font-mono text-[#344638]">
                  {baselineAssessment.totalScore}
                  <span className="text-xs text-[#737F71] font-normal"> / 100</span>
                </div>
                <div className="text-xs font-semibold text-[#737F71] uppercase mt-0.5">
                  {baselineAssessment.category} Risk
                </div>
              </div>
              <div
                className={`w-3.5 h-3.5 rounded-full ${
                  baselineAssessment.category === 'HIGH'
                    ? 'bg-[#C87868]'
                    : baselineAssessment.category === 'MODERATE'
                    ? 'bg-[#9E8C58]'
                    : 'bg-[#45664F]'
                }`}
              />
            </div>
            <p className="text-[11px] text-[#737F71] line-clamp-2 leading-relaxed">
              {baselineAssessment.explanation}
            </p>
          </div>

          {/* User-Adjusted Scenario */}
          <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#45664F]/50 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between pb-2 border-b border-[#DDE3D8]">
              <span className="text-xs font-bold text-[#45664F] uppercase flex items-center gap-1.5">
                Adjusted Scenario
              </span>
              <div
                className={`flex items-center gap-1 text-xs font-mono font-bold px-2 py-0.5 rounded ${
                  scoreDelta > 0
                    ? 'bg-[#C87868]/15 text-[#C87868] border border-[#C87868]/30'
                    : scoreDelta < 0
                    ? 'bg-[#E5EBDD] text-[#45664F] border border-[#45664F]/30'
                    : 'bg-[#F7F8F4] text-[#737F71] border border-[#DDE3D8]'
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
                <div className="text-2xl font-extrabold font-mono text-[#344638]">
                  {simulatedAssessment.totalScore}
                  <span className="text-xs text-[#737F71] font-normal"> / 100</span>
                </div>
                <div className="text-xs font-bold text-[#45664F] uppercase mt-0.5">
                  {simulatedAssessment.category} Risk
                </div>
              </div>
              <div
                className={`w-3.5 h-3.5 rounded-full ${
                  simulatedAssessment.category === 'HIGH'
                    ? 'bg-[#C87868]'
                    : simulatedAssessment.category === 'MODERATE'
                    ? 'bg-[#9E8C58]'
                    : 'bg-[#45664F]'
                }`}
              />
            </div>
            <p className="text-[11px] text-[#556353] line-clamp-2 leading-relaxed">
              {simulatedAssessment.explanation}
            </p>
          </div>
        </div>
      </div>

      {/* Transparent Disclaimer */}
      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#F7F8F4] border border-[#DDE3D8] text-[11px] text-[#737F71]">
        <AlertCircle className="w-4 h-4 text-[#45664F] shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-[#344638]">Heuristic Simulation Notice:</strong> This simulator illustrates relative susceptibility under municipal flood mechanics (BMC capacity, elevation saucer depth, tidal lockout). It is designed to assist urban planning and emergency precaution decisions, not to claim hydrodynamic sensor telemetry.
        </div>
      </div>
    </div>
  );
};
