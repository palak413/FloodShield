import React from 'react';
import {
  ShieldAlert,
  CloudRain,
  Activity,
  Layers,
  Sliders,
  Server,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import { LocationGeoData, LiveWeatherData } from '../types/flood';
import { ApiStatus } from '../services/api';

interface HeaderProps {
  locations: LocationGeoData[];
  selectedLocation: LocationGeoData;
  onSelectLocation: (location: LocationGeoData) => void;
  activeTab: 'overview' | 'simulator';
  onTabChange: (tab: 'overview' | 'simulator') => void;
  apiStatus: ApiStatus;
  weatherData: LiveWeatherData | null;
  onRefreshWeather: () => void;
  isWeatherLoading: boolean;
  onOpenAwsInspector: () => void;
  onLoadWeatherRainToSimulator?: (rainfallMm: number) => void;
}

export const Header: React.FC<HeaderProps> = ({
  locations,
  selectedLocation,
  onSelectLocation,
  activeTab,
  onTabChange,
  apiStatus,
  weatherData,
  onRefreshWeather,
  isWeatherLoading,
  onOpenAwsInspector,
  onLoadWeatherRainToSimulator,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#FFFFFF]/90 backdrop-blur-md border-b border-[#DDE3D8] px-4 lg:px-8 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & Subtitle */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#E5EBDD] border border-[#DDE3D8] text-[#45664F] shadow-xs">
              <ShieldAlert className="w-5 h-5 text-[#45664F]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-tight text-lg text-[#344638] font-mono">FLOODSHIELD</span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded bg-[#E5EBDD] text-[#45664F] border border-[#DDE3D8]">
                  MUMBAI
                </span>
              </div>
              <p className="text-[11px] font-semibold tracking-wider text-[#737F71] uppercase">
                Monsoon Intelligence Console
              </p>
            </div>
          </div>

          {/* Mobile Tab Switcher */}
          <div className="flex md:hidden bg-[#E5EBDD] p-1 rounded-lg border border-[#DDE3D8]">
            <button
              onClick={() => onTabChange('overview')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-all ${
                activeTab === 'overview'
                  ? 'bg-[#FFFFFF] text-[#45664F] shadow-xs font-semibold'
                  : 'text-[#737F71]'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => onTabChange('simulator')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-all ${
                activeTab === 'simulator'
                  ? 'bg-[#FFFFFF] text-[#45664F] shadow-xs font-semibold'
                  : 'text-[#737F71]'
              }`}
            >
              Simulator
            </button>
          </div>
        </div>

        {/* Location Selector & Weather Indicator */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-between md:justify-end">
          {/* Location Picker */}
          <div className="relative flex items-center bg-[#FFFFFF] border border-[#DDE3D8] rounded-lg px-2.5 py-1.5 shadow-2xs hover:border-[#45664F]/50 transition-colors">
            <Layers className="w-3.5 h-3.5 text-[#45664F] mr-2 shrink-0" />
            <select
              value={selectedLocation.id}
              onChange={(e) => {
                const loc = locations.find((l) => l.id === e.target.value);
                if (loc) onSelectLocation(loc);
              }}
              className="bg-transparent text-xs text-[#344638] focus:outline-none cursor-pointer pr-2 font-medium"
            >
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id} className="bg-[#FFFFFF] text-[#344638]">
                  {loc.name} ({loc.ward})
                </option>
              ))}
            </select>
          </div>

          {/* Weather Badge with Explicit Status */}
          {weatherData ? (
            <div className="hidden sm:flex items-center gap-2 bg-[#FFFFFF] border border-[#DDE3D8] rounded-lg px-2.5 py-1.5 text-xs shadow-2xs">
              <CloudRain className="w-3.5 h-3.5 text-[#45664F]" />
              <span className="text-[#344638] font-mono font-semibold">{weatherData.temperatureC}°C</span>
              <span className="text-[#DDE3D8]">|</span>
              <span className="text-[#737F71] text-[11px] truncate max-w-[100px]" title={weatherData.weatherDescription}>
                {weatherData.precipitationMm > 0 ? `${weatherData.precipitationMm} mm/h` : weatherData.weatherDescription}
              </span>

              {/* Source Integrity Pill */}
              <span
                className={`text-[9px] px-1 py-0.2 rounded font-mono font-bold uppercase ${
                  weatherData.status === 'LIVE'
                    ? 'bg-[#E5EBDD] text-[#45664F]'
                    : 'bg-[#9E8C58]/15 text-[#9E8C58]'
                }`}
                title={weatherData.sourceName}
              >
                {weatherData.status === 'LIVE' ? 'LIVE' : 'SAMPLE'}
              </span>

              {/* Weather-to-Simulator Action Button */}
              {onLoadWeatherRainToSimulator && (
                <button
                  onClick={() => onLoadWeatherRainToSimulator(weatherData.precipitationMm)}
                  title={`Load observed ${weatherData.precipitationMm} mm/h rainfall into simulator`}
                  className="text-[10px] text-[#45664F] hover:bg-[#E5EBDD] px-1.5 py-0.5 rounded transition-colors flex items-center gap-0.5 font-medium cursor-pointer"
                >
                  <span>Simulate</span>
                  <ArrowRight className="w-2.5 h-2.5" />
                </button>
              )}

              <button
                onClick={onRefreshWeather}
                title="Refresh weather telemetry"
                disabled={isWeatherLoading}
                className="text-[#737F71] hover:text-[#45664F] transition-colors ml-0.5 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isWeatherLoading ? 'animate-spin text-[#45664F]' : ''}`} />
              </button>
            </div>
          ) : isWeatherLoading ? (
            <div className="hidden sm:flex items-center gap-1.5 bg-[#FFFFFF] border border-[#DDE3D8] rounded-lg px-2.5 py-1.5 text-xs text-[#737F71]">
              <RefreshCw className="w-3 h-3 animate-spin text-[#45664F]" />
              <span>Fetching weather...</span>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-1.5 bg-[#FFFFFF] border border-[#DDE3D8] rounded-lg px-2.5 py-1.5 text-xs text-[#737F71]">
              <span>Weather Unavailable</span>
              <button onClick={onRefreshWeather} className="text-[#45664F] hover:underline cursor-pointer">Retry</button>
            </div>
          )}

          {/* Desktop Tab Switcher */}
          <div className="hidden md:flex bg-[#E5EBDD] p-1 rounded-lg border border-[#DDE3D8]">
            <button
              onClick={() => onTabChange('overview')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-md transition-all cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-[#FFFFFF] text-[#45664F] font-semibold shadow-xs'
                  : 'text-[#737F71] hover:text-[#344638]'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              Overview
            </button>
            <button
              onClick={() => onTabChange('simulator')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-md transition-all cursor-pointer ${
                activeTab === 'simulator'
                  ? 'bg-[#FFFFFF] text-[#45664F] font-semibold shadow-xs'
                  : 'text-[#737F71] hover:text-[#344638]'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              Storm Simulator
            </button>
          </div>

          {/* AWS Cloud Architecture & Diagnostic Pill */}
          <button
            onClick={onOpenAwsInspector}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer shadow-2xs ${
              apiStatus.isAwsLive
                ? 'bg-[#E5EBDD] border-[#45664F]/40 text-[#45664F] hover:bg-[#D8E2CE]'
                : 'bg-[#FFFFFF] border-[#DDE3D8] text-[#737F71] hover:border-[#45664F]/50 hover:text-[#344638]'
            }`}
            title="Inspect AWS Serverless Integration & Payload"
          >
            <Server className="w-3.5 h-3.5 text-[#45664F]" />
            <span className="font-mono text-[11px]">
              {apiStatus.isAwsLive ? 'AWS Lambda (Live)' : 'AWS Inspector'}
            </span>
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                apiStatus.isAwsLive ? 'bg-[#45664F] animate-pulse' : 'bg-[#737F71]'
              }`}
            />
          </button>
        </div>
      </div>
    </header>
  );
};
