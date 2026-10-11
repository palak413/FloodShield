import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { LocationGeoData, RiskAssessmentResult } from '../types/flood';
import { MapPin, Navigation, Info, ShieldCheck } from 'lucide-react';

interface MapViewProps {
  locations: LocationGeoData[];
  selectedLocation: LocationGeoData;
  onSelectLocation: (loc: LocationGeoData) => void;
  assessmentsMap: Record<string, RiskAssessmentResult>;
}

export const MapView: React.FC<MapViewProps> = ({
  locations,
  selectedLocation,
  onSelectLocation,
  assessmentsMap,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Initialize Leaflet Map centered on central Mumbai
      const map = L.map(mapContainerRef.current, {
        center: [19.055, 72.85],
        zoom: 12,
        minZoom: 10,
        maxZoom: 16,
        zoomControl: false,
      });

      // CartoDB Dark Matter Basemap Tiles
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      // Add Zoom control at top-right
      L.control
        .zoom({
          position: 'topright',
        })
        .addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Remove existing markers
    Object.values(markersRef.current).forEach((m) => m.remove());
    markersRef.current = {};

    // Render Markers
    locations.forEach((loc) => {
      const assessment = assessmentsMap[loc.id];
      const score = assessment ? assessment.totalScore : 50;
      const category = assessment ? assessment.category : 'MODERATE';
      const isSelected = selectedLocation.id === loc.id;

      let colorClass = 'bg-[#F43F5E] text-white border-[#F43F5E]';
      let pulseClass = 'pulse-marker-high';
      let badgeBg = 'bg-[#F43F5E]';

      if (category === 'LOW') {
        colorClass = 'bg-[#00F2FE] text-[#09111F] border-[#00F2FE]';
        pulseClass = 'pulse-marker-low';
        badgeBg = 'bg-[#00F2FE]';
      } else if (category === 'MODERATE') {
        colorClass = 'bg-[#F59E0B] text-[#09111F] border-[#F59E0B]';
        pulseClass = 'pulse-marker-moderate';
        badgeBg = 'bg-[#F59E0B]';
      }

      const ringEffect = isSelected
        ? 'ring-4 ring-white ring-offset-2 ring-offset-[#09111F] scale-110'
        : 'hover:scale-105';

      const customHtml = `
        <div class="relative flex items-center justify-center cursor-pointer transition-transform duration-200 ${ringEffect}">
          <div class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-[11px] font-mono shadow-lg border-2 ${colorClass} ${pulseClass}">
            ${score}
          </div>
          <div class="absolute -bottom-5 whitespace-nowrap px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#0E1726]/90 border border-[#1C2B44] text-[#F1F5F9] shadow pointer-events-none">
            ${loc.name.split(',')[0]}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-flood-marker',
        html: customHtml,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const marker = L.marker(loc.coordinates, { icon: customIcon }).addTo(map);

      // Popup
      const popupHtml = `
        <div class="font-sans text-xs">
          <div class="font-bold text-sm text-white mb-1">${loc.name}</div>
          <div class="text-[#94A3B8] mb-1.5">${loc.marathiName} · <span class="text-[#00F2FE]">${loc.ward}</span></div>
          <div class="flex items-center gap-2 mb-2">
            <span class="px-1.5 py-0.5 rounded text-[10px] font-bold ${badgeBg} ${category === 'HIGH' ? 'text-white' : 'text-black'}">
              ${category} RISK: ${score}/100
            </span>
            <span class="text-[11px] text-[#94A3B8]">Elev: ${loc.elevationMeters}m</span>
          </div>
          <p class="text-[11px] text-[#CBD5E1] line-clamp-2">${loc.description}</p>
        </div>
      `;
      marker.bindPopup(popupHtml);

      marker.on('click', () => {
        onSelectLocation(loc);
      });

      markersRef.current[loc.id] = marker;
    });

    // Fly to selected location smoothly
    if (selectedLocation) {
      map.flyTo(selectedLocation.coordinates, Math.max(map.getZoom(), 13), {
        animate: true,
        duration: 0.8,
      });
    }

    // Force map size invalidation on resize
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => clearTimeout(timer);
  }, [locations, selectedLocation, assessmentsMap, onSelectLocation]);

  const handleCenterMumbai = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([19.055, 72.85], 12, { animate: true, duration: 0.8 });
    }
  };

  return (
    <div className="relative w-full h-[420px] lg:h-[620px] rounded-2xl overflow-hidden border border-[#1C2B44] bg-[#0E1726] shadow-2xl">
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Header Info */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-[#0E1726]/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#1C2B44] text-xs">
        <MapPin className="w-3.5 h-3.5 text-[#00F2FE]" />
        <span className="font-semibold text-white">Mumbai Metropolitan Region</span>
        <span className="text-[#94A3B8]">|</span>
        <span className="text-[#94A3B8] font-mono text-[11px]">CartoDB Dark Matter</span>
      </div>

      {/* Recenter Button */}
      <button
        onClick={handleCenterMumbai}
        className="absolute top-12 left-3 z-10 flex items-center gap-1.5 bg-[#0E1726]/90 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-[#1C2B44] text-[11px] text-[#94A3B8] hover:text-[#00F2FE] hover:border-[#00F2FE]/40 transition-all cursor-pointer shadow-lg"
        title="Reset map view to whole Mumbai"
      >
        <Navigation className="w-3 h-3 text-[#00F2FE]" />
        Recenter
      </button>

      {/* Interactive Legend */}
      <div className="absolute bottom-3 left-3 z-10 bg-[#0E1726]/95 backdrop-blur-md p-3 rounded-xl border border-[#1C2B44] shadow-xl text-xs max-w-[280px]">
        <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-[#1C2B44]">
          <span className="font-semibold text-white tracking-wide text-[11px] uppercase">
            Risk Classification
          </span>
          <span className="text-[10px] text-[#94A3B8] font-mono">0 - 100 Index</span>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F43F5E] shadow-[0_0_8px_#F43F5E]" />
              <span className="text-[#F1F5F9] font-medium">High Vulnerability</span>
            </div>
            <span className="font-mono text-[#F43F5E] font-semibold">70 - 100</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] shadow-[0_0_8px_#F59E0B]" />
              <span className="text-[#F1F5F9] font-medium">Moderate Advisory</span>
            </div>
            <span className="font-mono text-[#F59E0B] font-semibold">40 - 69</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00F2FE] shadow-[0_0_8px_#00F2FE]" />
              <span className="text-[#F1F5F9] font-medium">Low Susceptibility</span>
            </div>
            <span className="font-mono text-[#00F2FE] font-semibold">0 - 39</span>
          </div>
        </div>
        <div className="mt-2.5 pt-2 border-t border-[#1C2B44] flex items-center gap-1.5 text-[10px] text-[#94A3B8]">
          <Info className="w-3 h-3 text-[#00F2FE] shrink-0" />
          <span>Click any marker to inspect localized risk breakdown.</span>
        </div>
      </div>

      {/* Disclaimers & Provenance Note */}
      <div className="absolute bottom-3 right-3 z-10 hidden sm:block bg-[#0E1726]/90 backdrop-blur-md px-2.5 py-1 rounded-md border border-[#1C2B44] text-[10px] text-[#94A3B8]">
        Simulated Heuristic Overlays · Not a Telemetry Boundary
      </div>
    </div>
  );
};
