import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { LocationGeoData, RiskAssessmentResult } from '../types/flood';
import { MapPin, Navigation, Info } from 'lucide-react';

interface MapViewProps {
  locations: LocationGeoData[];
  selectedLocation: LocationGeoData;
  onSelectLocation: (loc: LocationGeoData) => void;
  assessmentsMap: Record<string, RiskAssessmentResult>;
}

function createMarkerIcon(
  locName: string,
  score: number,
  category: 'LOW' | 'MODERATE' | 'HIGH',
  isSelected: boolean
): L.DivIcon {
  let colorClass = 'bg-[#C87868] text-white border-[#C87868]';
  let pulseClass = 'pulse-marker-high';

  if (category === 'LOW') {
    colorClass = 'bg-[#45664F] text-white border-[#45664F]';
    pulseClass = 'pulse-marker-low';
  } else if (category === 'MODERATE') {
    colorClass = 'bg-[#9E8C58] text-white border-[#9E8C58]';
    pulseClass = 'pulse-marker-moderate';
  }

  const ringEffect = isSelected
    ? 'ring-3 ring-[#344638] ring-offset-2 ring-offset-white scale-110 z-30'
    : 'hover:scale-105';

  const customHtml = `
    <div class="relative flex items-center justify-center cursor-pointer transition-transform duration-200 ${ringEffect}">
      <div class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-[11px] font-mono shadow-md border-2 ${colorClass} ${pulseClass}">
        ${score}
      </div>
      <div class="absolute -bottom-5 whitespace-nowrap px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#FFFFFF] border border-[#DDE3D8] text-[#344638] shadow-xs pointer-events-none">
        ${locName.split(',')[0]}
      </div>
    </div>
  `;

  return L.divIcon({
    className: 'custom-flood-marker',
    html: customHtml,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

function createPopupContent(
  loc: LocationGeoData,
  score: number,
  category: 'LOW' | 'MODERATE' | 'HIGH'
): string {
  let badgeBg = 'bg-[#C87868] text-white';
  if (category === 'LOW') badgeBg = 'bg-[#45664F] text-white';
  else if (category === 'MODERATE') badgeBg = 'bg-[#9E8C58] text-white';

  return `
    <div class="font-sans text-xs p-1">
      <div class="font-bold text-sm text-[#344638] mb-0.5">${loc.name}</div>
      <div class="text-[#737F71] mb-1.5">${loc.marathiName} · <span class="text-[#45664F] font-semibold">${loc.ward}</span></div>
      <div class="flex items-center gap-2 mb-2">
        <span class="px-1.5 py-0.5 rounded text-[10px] font-bold ${badgeBg}">
          ${category} RISK: ${score}/100
        </span>
        <span class="text-[11px] text-[#737F71]">Elev: ${loc.elevationMeters}m</span>
      </div>
      <p class="text-[11px] text-[#556353] line-clamp-2 leading-relaxed">${loc.description}</p>
    </div>
  `;
}

export const MapView: React.FC<MapViewProps> = ({
  locations,
  selectedLocation,
  onSelectLocation,
  assessmentsMap,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersMapRef = useRef<Map<string, L.Marker>>(new Map());
  const prevSelectedIdRef = useRef<string | null>(selectedLocation.id);
  const onSelectLocationRef = useRef(onSelectLocation);

  // Keep latest onSelectLocation callback in ref to prevent listener rebuilds
  useEffect(() => {
    onSelectLocationRef.current = onSelectLocation;
  }, [onSelectLocation]);

  // 1. Initialize Map ONCE on mount
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Safety clear leaflet id if re-mounting in strict mode
    if ((mapContainerRef.current as unknown as { _leaflet_id?: unknown })._leaflet_id) {
      delete (mapContainerRef.current as unknown as { _leaflet_id?: unknown })._leaflet_id;
    }

    const map = L.map(mapContainerRef.current, {
      center: [19.055, 72.85],
      zoom: 12,
      minZoom: 10,
      maxZoom: 16,
      zoomControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    L.control
      .zoom({
        position: 'topright',
      })
      .addTo(map);

    mapInstanceRef.current = map;

    const markersMap = markersMapRef.current;
    const container = mapContainerRef.current;
    return () => {
      markersMap.forEach((marker) => {
        marker.off();
      });
      map.remove();
      mapInstanceRef.current = null;
      markersMap.clear();
      if (container && (container as unknown as { _leaflet_id?: unknown })._leaflet_id) {
        delete (container as unknown as { _leaflet_id?: unknown })._leaflet_id;
      }
    };
  }, []);

  // 2. Update markers independently from map initialization
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    locations.forEach((loc) => {
      const assessment = assessmentsMap[loc.id];
      const score = assessment ? assessment.totalScore : 50;
      const category = assessment ? assessment.category : 'MODERATE';
      const isSelected = selectedLocation.id === loc.id;

      const icon = createMarkerIcon(loc.name, score, category, isSelected);
      const popupHtml = createPopupContent(loc, score, category);

      const existingMarker = markersMapRef.current.get(loc.id);

      if (existingMarker) {
        existingMarker.setIcon(icon);
        existingMarker.setPopupContent(popupHtml);
      } else {
        const marker = L.marker(loc.coordinates, { icon }).addTo(map);
        marker.bindPopup(popupHtml);
        marker.on('click', () => {
          onSelectLocationRef.current(loc);
        });
        markersMapRef.current.set(loc.id, marker);
      }
    });
  }, [locations, assessmentsMap, selectedLocation.id]);

  // 3. Animate map ONLY when selectedLocation.id changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (prevSelectedIdRef.current !== selectedLocation.id) {
      prevSelectedIdRef.current = selectedLocation.id;
      map.flyTo(selectedLocation.coordinates, Math.max(map.getZoom(), 13), {
        animate: true,
        duration: 0.8,
      });
    }
  }, [selectedLocation.id, selectedLocation.coordinates]);

  const handleCenterMumbai = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([19.055, 72.85], 12, { animate: true, duration: 0.8 });
    }
  };

  return (
    <div className="relative w-full h-[420px] lg:h-[620px] rounded-2xl overflow-hidden border border-[#DDE3D8] bg-[#F7F8F4] shadow-xs">
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Header Info */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-[#FFFFFF]/95 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#DDE3D8] text-xs shadow-2xs">
        <MapPin className="w-3.5 h-3.5 text-[#45664F]" />
        <span className="font-semibold text-[#344638]">Mumbai Metropolitan Region</span>
        <span className="text-[#DDE3D8]">|</span>
        <span className="text-[#737F71] font-mono text-[11px]">CartoDB Positron</span>
      </div>

      {/* Recenter Button */}
      <button
        onClick={handleCenterMumbai}
        className="absolute top-12 left-3 z-10 flex items-center gap-1.5 bg-[#FFFFFF]/95 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-[#DDE3D8] text-[11px] text-[#737F71] hover:text-[#45664F] hover:border-[#45664F]/50 transition-all cursor-pointer shadow-xs"
        title="Reset map view to whole Mumbai"
      >
        <Navigation className="w-3 h-3 text-[#45664F]" />
        Recenter
      </button>

      {/* Interactive Legend */}
      <div className="absolute bottom-3 left-3 z-10 bg-[#FFFFFF]/95 backdrop-blur-md p-3 rounded-xl border border-[#DDE3D8] shadow-md text-xs max-w-[280px]">
        <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-[#DDE3D8]">
          <span className="font-bold text-[#344638] tracking-wide text-[11px] uppercase">
            Risk Classification
          </span>
          <span className="text-[10px] text-[#737F71] font-mono">0 - 100 Index</span>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#C87868] shadow-xs" />
              <span className="text-[#344638] font-medium">High Vulnerability</span>
            </div>
            <span className="font-mono text-[#C87868] font-bold">70 - 100</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#9E8C58] shadow-xs" />
              <span className="text-[#344638] font-medium">Moderate Advisory</span>
            </div>
            <span className="font-mono text-[#9E8C58] font-bold">40 - 69</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#45664F] shadow-xs" />
              <span className="text-[#344638] font-medium">Low Susceptibility</span>
            </div>
            <span className="font-mono text-[#45664F] font-bold">0 - 39</span>
          </div>
        </div>
        <div className="mt-2.5 pt-2 border-t border-[#DDE3D8] flex items-center gap-1.5 text-[10px] text-[#737F71]">
          <Info className="w-3 h-3 text-[#45664F] shrink-0" />
          <span>Click any marker to inspect localized risk breakdown.</span>
        </div>
      </div>

      {/* Disclaimers & Provenance Note */}
      <div className="absolute bottom-3 right-3 z-10 hidden sm:block bg-[#FFFFFF]/90 backdrop-blur-md px-2.5 py-1 rounded-md border border-[#DDE3D8] text-[10px] text-[#737F71] shadow-2xs">
        Heuristic Vulnerability Index · Not a Live Flood Boundary
      </div>
    </div>
  );
};
