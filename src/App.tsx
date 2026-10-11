import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from './components/Header';
import { MapView } from './components/MapView';
import { RiskPanel } from './components/RiskPanel';
import { StormSimulator } from './components/StormSimulator';
import { AwsInspectorModal } from './components/AwsInspectorModal';
import { MUMBAI_LOCATIONS } from './data/mumbaiLocations';
import {
  LocationGeoData,
  SimulationParams,
  RiskAssessmentResult,
  LiveWeatherData,
} from './types/flood';
import { calculateFloodRisk } from './services/riskEngine';
import { checkAwsHealth, requestRiskAssessment, ApiStatus } from './services/api';
import { fetchLiveMumbaiWeather } from './services/weatherApi';
import {
  CloudRain,
  ShieldAlert,
  Info,
  Layers,
  Compass,
  AlertTriangle,
  ExternalLink,
  Droplets,
  Wind,
  Gauge,
} from 'lucide-react';

const DEFAULT_SIMULATION_PARAMS: SimulationParams = {
  rainfallMmPerHour: 35,
  durationHours: 2,
  tideLevel: 'MID_TIDE',
  drainageCondition: 'STANDARD',
};

const BASELINE_PARAMS: SimulationParams = {
  rainfallMmPerHour: 25,
  durationHours: 2,
  tideLevel: 'MID_TIDE',
  drainageCondition: 'STANDARD',
};

export const App: React.FC = () => {
  const [locations] = useState<LocationGeoData[]>(MUMBAI_LOCATIONS);
  const [selectedLocation, setSelectedLocation] = useState<LocationGeoData>(MUMBAI_LOCATIONS[0]);
  const [simulationParams, setSimulationParams] = useState<SimulationParams>(DEFAULT_SIMULATION_PARAMS);
  const [activeTab, setActiveTab] = useState<'overview' | 'simulator'>('overview');
  const [isAwsInspectorOpen, setIsAwsInspectorOpen] = useState<boolean>(false);

  // Weather state
  const [weatherData, setWeatherData] = useState<LiveWeatherData | null>(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState<boolean>(false);

  // API Health status
  const [apiStatus, setApiStatus] = useState<ApiStatus>({
    isAwsLive: false,
    endpointUrl: import.meta.env.VITE_AWS_API_URL || 'Local Heuristic Engine',
    lastChecked: new Date().toLocaleTimeString('en-IN'),
  });

  // Fetch weather and API health on initial load
  const loadWeather = useCallback(async () => {
    setIsWeatherLoading(true);
    try {
      const data = await fetchLiveMumbaiWeather();
      setWeatherData(data);
    } finally {
      setIsWeatherLoading(false);
    }
  }, []);

  const refreshApiHealth = useCallback(async () => {
    const status = await checkAwsHealth();
    setApiStatus(status);
  }, []);

  useEffect(() => {
    loadWeather();
    refreshApiHealth();
  }, [loadWeather, refreshApiHealth]);

  // State for active assessment
  const [activeAssessment, setActiveAssessment] = useState<RiskAssessmentResult>(() =>
    calculateFloodRisk(MUMBAI_LOCATIONS[0], DEFAULT_SIMULATION_PARAMS, 'LOCAL_FALLBACK')
  );

  // Compute assessments for all locations based on current simulation params
  const assessmentsMap = useMemo(() => {
    const map: Record<string, RiskAssessmentResult> = {};
    locations.forEach((loc) => {
      if (loc.id === selectedLocation.id && activeAssessment) {
        map[loc.id] = activeAssessment;
      } else {
        map[loc.id] = calculateFloodRisk(loc, simulationParams, 'LOCAL_FALLBACK');
      }
    });
    return map;
  }, [locations, simulationParams, selectedLocation.id, activeAssessment]);

  // Update active assessment whenever selectedLocation, params, or API status changes
  useEffect(() => {
    let isCancelled = false;

    // Immediately update with local calculation to avoid UI latency
    const localResult = calculateFloodRisk(selectedLocation, simulationParams, 'LOCAL_FALLBACK');
    setActiveAssessment(localResult);

    // If API is available or configured, query the server endpoint
    if (apiStatus.isAwsLive || import.meta.env.VITE_AWS_API_URL) {
      requestRiskAssessment(selectedLocation, simulationParams).then((res) => {
        if (!isCancelled && res) {
          setActiveAssessment(res);
        }
      });
    }

    return () => {
      isCancelled = true;
    };
  }, [selectedLocation, simulationParams, apiStatus.isAwsLive]);

  // Baseline assessment for currently selected location
  const baselineAssessment = useMemo(() => {
    return calculateFloodRisk(selectedLocation, BASELINE_PARAMS, 'LOCAL_FALLBACK');
  }, [selectedLocation]);

  return (
    <div className="min-h-screen bg-[#F7F8F4] text-[#344638] flex flex-col font-sans">
      {/* Top Header */}
      <Header
        locations={locations}
        selectedLocation={selectedLocation}
        onSelectLocation={setSelectedLocation}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        apiStatus={apiStatus}
        weatherData={weatherData}
        onRefreshWeather={loadWeather}
        isWeatherLoading={isWeatherLoading}
        onOpenAwsInspector={() => setIsAwsInspectorOpen(true)}
      />

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 space-y-6">
        {/* Core Workspace Switcher */}
        {activeTab === 'overview' ? (
          <div className="space-y-6">
            {/* Top Grid: Interactive Map (~60%) + Risk Intelligence Panel (~40%) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-7">
                <MapView
                  locations={locations}
                  selectedLocation={selectedLocation}
                  onSelectLocation={setSelectedLocation}
                  assessmentsMap={assessmentsMap}
                />
              </div>

              <div className="lg:col-span-5">
                <RiskPanel
                  location={selectedLocation}
                  assessment={activeAssessment}
                  onOpenAwsInspector={() => setIsAwsInspectorOpen(true)}
                />
              </div>
            </div>

            {/* Bottom Section: Location Matrix & Weather Telemetry */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Grounded Locations Quick Grid */}
              <div className="md:col-span-2 bg-[#FFFFFF] border border-[#DDE3D8] rounded-2xl p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#DDE3D8]">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#45664F]" />
                    <h3 className="font-bold text-sm text-[#344638] uppercase tracking-wider">
                      Mumbai Vulnerability Hotspots ({locations.length} Locations)
                    </h3>
                  </div>
                  <span className="text-[11px] text-[#737F71]">Click to switch focus</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {locations.map((loc) => {
                    const res = assessmentsMap[loc.id];
                    const isSelected = loc.id === selectedLocation.id;
                    const isHigh = res?.category === 'HIGH';
                    const isMod = res?.category === 'MODERATE';

                    return (
                      <button
                        key={loc.id}
                        onClick={() => setSelectedLocation(loc)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between shadow-2xs ${
                          isSelected
                            ? 'bg-[#E5EBDD] border-[#45664F] ring-1 ring-[#45664F]'
                            : 'bg-[#FFFFFF] border-[#DDE3D8] hover:bg-[#F7F8F4] hover:border-[#B8C4B3]'
                        }`}
                      >
                        <div className="truncate mr-2">
                          <div className="font-semibold text-xs text-[#344638] truncate">{loc.name}</div>
                          <div className="text-[11px] text-[#737F71] font-mono">
                            {loc.ward} · {loc.elevationMeters}m elev
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                              isHigh
                                ? 'bg-[#C87868]/15 text-[#C87868] border border-[#C87868]/30'
                                : isMod
                                ? 'bg-[#9E8C58]/15 text-[#9E8C58] border border-[#9E8C58]/30'
                                : 'bg-[#E5EBDD] text-[#45664F] border border-[#45664F]/30'
                            }`}
                          >
                            {res?.totalScore ?? '--'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Weather Telemetry & Open-Meteo Diagnostics */}
              <div className="bg-[#FFFFFF] border border-[#DDE3D8] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#DDE3D8]">
                    <div className="flex items-center gap-2">
                      <CloudRain className="w-4 h-4 text-[#45664F]" />
                      <h3 className="font-bold text-sm text-[#344638] uppercase tracking-wider">
                        Live Mumbai Weather
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-[#E5EBDD] text-[#45664F] border border-[#DDE3D8]">
                      Open-Meteo
                    </span>
                  </div>

                  {weatherData ? (
                    <div className="space-y-3">
                      <div className="flex items-baseline justify-between">
                        <div>
                          <span className="text-3xl font-extrabold text-[#344638] font-mono">
                            {weatherData.temperatureC}°C
                          </span>
                          <p className="text-xs text-[#737F71] capitalize mt-0.5">
                            {weatherData.weatherDescription}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold font-mono text-[#45664F]">
                            {weatherData.precipitationMm} mm/h
                          </span>
                          <p className="text-[10px] text-[#737F71]">Current Rain</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-[#DDE3D8]">
                        <div className="flex items-center gap-1.5 text-[#737F71]">
                          <Droplets className="w-3.5 h-3.5 text-[#45664F]" />
                          <span>Humidity: {weatherData.relativeHumidity}%</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[#737F71]">
                          <Wind className="w-3.5 h-3.5 text-[#45664F]" />
                          <span>Wind: {weatherData.windSpeedKmh} km/h</span>
                        </div>
                      </div>

                      {/* Hourly Mini Forecast */}
                      <div className="pt-2 border-t border-[#DDE3D8]">
                        <div className="text-[11px] font-semibold text-[#344638] mb-1.5">
                          Upcoming Precipitation Projection
                        </div>
                        <div className="grid grid-cols-3 gap-1.5 text-center">
                          {weatherData.hourlyForecast.slice(0, 3).map((hf, i) => (
                            <div key={i} className="p-1.5 rounded bg-[#F7F8F4] border border-[#DDE3D8]">
                              <div className="text-[10px] text-[#737F71]">{hf.time}</div>
                              <div className="text-xs font-mono font-bold text-[#45664F]">
                                {hf.precipitationMm} mm
                              </div>
                              <div className="text-[9px] text-[#737F71]">{hf.rainProbability}% prob</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 text-center text-xs text-[#737F71]">
                      Loading real-time meteorological feed...
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-[#DDE3D8] text-[10px] text-[#737F71] flex items-center justify-between">
                  <span>Source: Open-Meteo API (19.076°N, 72.877°E)</span>
                  <span className="text-[#45664F] font-semibold">Live Telemetry</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Storm Simulator Workspace */
          <div className="space-y-6">
            <StormSimulator
              locations={locations}
              selectedLocation={selectedLocation}
              onSelectLocation={setSelectedLocation}
              currentParams={simulationParams}
              onUpdateParams={setSimulationParams}
              baselineAssessment={baselineAssessment}
              simulatedAssessment={activeAssessment}
            />

            {/* Map & Risk Panel in Simulator Mode for Instant Visual Feedback */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-7">
                <MapView
                  locations={locations}
                  selectedLocation={selectedLocation}
                  onSelectLocation={setSelectedLocation}
                  assessmentsMap={assessmentsMap}
                />
              </div>

              <div className="lg:col-span-5">
                <RiskPanel
                  location={selectedLocation}
                  assessment={activeAssessment}
                  onOpenAwsInspector={() => setIsAwsInspectorOpen(true)}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#DDE3D8] bg-[#FFFFFF] py-4 px-4 lg:px-8 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#737F71]">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#45664F]" />
            <span className="font-bold text-[#344638]">FloodShield MVP</span>
            <span>· Environmental Hackathon (Heat & Water Track)</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span>Deterministic Heuristic Risk Engine</span>
            <span>·</span>
            <span>AWS Serverless Lambda Node.js</span>
            <span>·</span>
            <button
              onClick={() => setIsAwsInspectorOpen(true)}
              className="text-[#45664F] hover:underline cursor-pointer font-medium"
            >
              Architecture & API Gateway
            </button>
          </div>
        </div>
      </footer>

      {/* AWS Inspector Modal */}
      <AwsInspectorModal
        isOpen={isAwsInspectorOpen}
        onClose={() => setIsAwsInspectorOpen(false)}
        apiStatus={apiStatus}
        onRefreshStatus={refreshApiHealth}
      />
    </div>
  );
};

export default App;
