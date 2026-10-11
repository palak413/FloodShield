import React from 'react';
import {
  ShieldAlert,
  CloudRain,
  Activity,
  Layers,
  Sliders,
  CheckCircle2,
  Server,
  RefreshCw,
  ExternalLink,
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
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#09111F]/90 backdrop-blur-md border-b border-[#1C2B44] px-4 lg:px-8 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & Subtitle */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[#00F2FE]/20 to-[#132035] border border-[#00F2FE]/40 shadow-[0_0_15px_rgba(0,242,254,0.15)]">
              <ShieldAlert className="w-5 h-5 text-[#00F2FE]" />
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#00F2FE] animate-ping" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-tight text-lg text-white font-mono">FLOODSHIELD</span>
                <span className="px-1.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded bg-[#00F2FE]/10 text-[#00F2FE] border border-[#00F2FE]/30">
                  MUMBAI
                </span>
              </div>
              <p className="text-[11px] font-medium tracking-wider text-[#94A3B8] uppercase">
                Monsoon Intelligence Console
              </p>
            </div>
          </div>

          {/* Mobile Tab Switcher */}
          <div className="flex md:hidden bg-[#0E1726] p-1 rounded-lg border border-[#1C2B44]">
            <button
              onClick={() => onTabChange('overview')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-all ${
                activeTab === 'overview'
                  ? 'bg-[#1C2B44] text-[#00F2FE]'
                  : 'text-[#94A3B8]'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => onTabChange('simulator')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-all ${
                activeTab === 'simulator'
                  ? 'bg-[#1C2B44] text-[#00F2FE]'
                  : 'text-[#94A3B8]'
              }`}
            >
              Simulator
            </button>
          </div>
        </div>

        {/* Location Selector & Weather Indicator */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-between md:justify-end">
          {/* Quick Location Picker */}
          <div className="relative flex items-center bg-[#0E1726] border border-[#1C2B44] rounded-lg px-2.5 py-1.5">
            <Layers className="w-3.5 h-3.5 text-[#00F2FE] mr-2 shrink-0" />
            <select
              value={selectedLocation.id}
              onChange={(e) => {
                const loc = locations.find((l) => l.id === e.target.value);
                if (loc) onSelectLocation(loc);
              }}
              className="bg-transparent text-xs text-[#F1F5F9] focus:outline-none cursor-pointer pr-2 font-medium"
            >
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id} className="bg-[#0E1726] text-[#F1F5F9]">
                  {loc.name} ({loc.ward})
                </option>
              ))}
            </select>
          </div>

          {/* Live Mumbai Weather Badge */}
          {weatherData && (
            <div className="hidden sm:flex items-center gap-2 bg-[#0E1726] border border-[#1C2B44] rounded-lg px-2.5 py-1.5 text-xs">
              <CloudRain className="w-3.5 h-3.5 text-[#00F2FE]" />
              <span className="text-[#F1F5F9] font-mono">{weatherData.temperatureC}°C</span>
              <span className="text-[#94A3B8] text-[11px]">|</span>
              <span className="text-[#94A3B8] text-[11px] truncate max-w-[110px]" title={weatherData.weatherDescription}>
                {weatherData.precipitationMm > 0 ? `${weatherData.precipitationMm} mm/h` : weatherData.weatherDescription}
              </span>
              <button
                onClick={onRefreshWeather}
                title="Refresh live telemetry"
                disabled={isWeatherLoading}
                className="text-[#94A3B8] hover:text-[#00F2FE] transition-colors ml-0.5"
              >
                <RefreshCw className={`w-3 h-3 ${isWeatherLoading ? 'animate-spin text-[#00F2FE]' : ''}`} />
              </button>
            </div>
          )}

          {/* Desktop Tab Switcher */}
          <div className="hidden md:flex bg-[#0E1726] p-1 rounded-lg border border-[#1C2B44]">
            <button
              onClick={() => onTabChange('overview')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all ${
                activeTab === 'overview'
                  ? 'bg-[#1C2B44] text-[#00F2FE] shadow-[0_0_10px_rgba(0,242,254,0.1)]'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              Overview
            </button>
            <button
              onClick={() => onTabChange('simulator')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all ${
                activeTab === 'simulator'
                  ? 'bg-[#1C2B44] text-[#00F2FE] shadow-[0_0_10px_rgba(0,242,254,0.1)]'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              Storm Simulator
            </button>
          </div>

          {/* AWS Cloud Architecture & Diagnostic Pill */}
          <button
            onClick={onOpenAwsInspector}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
              apiStatus.isAwsLive
                ? 'bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981] hover:bg-[#10B981]/20'
                : 'bg-[#0E1726] border-[#283D62] text-[#94A3B8] hover:border-[#00F2FE]/50 hover:text-white'
            }`}
            title="Inspect AWS Serverless Integration & Payload"
          >
            <Server className="w-3.5 h-3.5" />
            <span className="font-mono text-[11px]">
              {apiStatus.isAwsLive ? 'AWS Lambda (Live)' : 'AWS Inspector'}
            </span>
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                apiStatus.isAwsLive ? 'bg-[#10B981] animate-pulse' : 'bg-[#00F2FE]'
              }`}
            />
          </button>
        </div>
      </div>
    </header>
  );
};
