import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { GridPoint } from '../types';

interface MapComponentProps {
  centerLat: number;
  centerLng: number;
  businessName: string;
  points: GridPoint[];
  stepKm: number;
  isPickingCenter: boolean;
  onSelectCenter: (lat: number, lng: number) => void;
  onSelectPoint: (point: GridPoint) => void;
  selectedPointId?: string | null;
}

export const MapComponent: React.FC<MapComponentProps> = ({
  centerLat,
  centerLng,
  businessName,
  points,
  stepKm,
  isPickingCenter,
  onSelectCenter,
  onSelectPoint,
  selectedPointId,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const centerMarkerRef = useRef<L.Marker | null>(null);
  const coverageCircleRef = useRef<L.Circle | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [centerLat, centerLng],
      zoom: 13,
      zoomControl: true,
      attributionControl: false,
    });

    // Dark-themed or clean OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    L.control
      .attribution({
        position: 'bottomright',
        prefix: 'Leaflet | &copy; <a href="https://openstreetmap.org" target="_blank">OSM</a>',
      })
      .addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Handle map click for picking center
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleClick = (e: L.LeafletMouseEvent) => {
      if (isPickingCenter) {
        onSelectCenter(e.latlng.lat, e.latlng.lng);
      }
    };

    map.on('click', handleClick);
    return () => {
      map.off('click', handleClick);
    };
  }, [isPickingCenter, onSelectCenter]);

  // Update center marker & coverage circle
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Center icon: Business marker
    const centerIcon = L.divIcon({
      className: 'leaflet-center-pin',
      html: `
        <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-full cursor-pointer group">
          <div class="absolute -bottom-1 w-3 h-1 bg-black/40 rounded-full blur-[1px]"></div>
          <div class="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 border-2 border-white shadow-xl flex items-center justify-center text-white font-bold text-xs ring-4 ring-indigo-500/30 transition-transform group-hover:scale-110">
            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div class="absolute -top-7 px-2 py-0.5 rounded bg-slate-900/90 text-[11px] font-medium text-white shadow border border-slate-700 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            ${businessName || 'Tâm quét'}
          </div>
        </div>
      `,
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });

    if (!centerMarkerRef.current) {
      centerMarkerRef.current = L.marker([centerLat, centerLng], {
        icon: centerIcon,
        zIndexOffset: 1000,
      }).addTo(map);
    } else {
      centerMarkerRef.current.setLatLng([centerLat, centerLng]);
      centerMarkerRef.current.setIcon(centerIcon);
    }

    // Radius circle showing coverage area
    const maxRadiusMeters = (stepKm * (points.length > 0 ? Math.sqrt(points.length) : 5) * 1000) / 1.8;
    if (!coverageCircleRef.current) {
      coverageCircleRef.current = L.circle([centerLat, centerLng], {
        radius: maxRadiusMeters,
        color: '#6366f1',
        weight: 1.5,
        opacity: 0.5,
        dashArray: '6, 6',
        fillColor: '#818cf8',
        fillOpacity: 0.04,
      }).addTo(map);
    } else {
      coverageCircleRef.current.setLatLng([centerLat, centerLng]);
      coverageCircleRef.current.setRadius(maxRadiusMeters);
    }
  }, [centerLat, centerLng, businessName, stepKm, points.length]);

  // Render Grid Points
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    points.forEach((pt) => {
      let badgeColor = '';
      let badgeText = pt.rankDisplay;
      let badgeClasses = '';
      let isSelected = pt.id === selectedPointId;

      if (pt.status === 'scanning') {
        badgeClasses = 'bg-sky-500 text-white animate-pulse ring-4 ring-sky-400/40 shadow-sky-500/50';
        badgeText = '...';
      } else if (pt.status === 'failed') {
        badgeClasses = 'bg-rose-700 text-white ring-2 ring-rose-400';
        badgeText = '!';
      } else if (pt.status === 'success') {
        if (pt.rank !== null && pt.rank >= 1 && pt.rank <= 3) {
          badgeClasses = 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/40 font-bold border-2 border-emerald-300';
        } else if (pt.rank !== null && pt.rank >= 4 && pt.rank <= 10) {
          badgeClasses = 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-lg shadow-amber-500/40 border-2 border-amber-300';
        } else if (pt.rank !== null && pt.rank >= 11 && pt.rank <= 20) {
          badgeClasses = 'bg-rose-500 hover:bg-rose-400 text-white font-bold shadow-lg shadow-rose-500/40 border-2 border-rose-300';
        } else {
          // 20+
          badgeClasses = 'bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold border-2 border-slate-500 shadow';
        }
      } else {
        // Pending / Preview
        badgeClasses = 'bg-slate-800/80 text-slate-400 border border-slate-600 border-dashed hover:border-sky-400 hover:text-sky-300';
        badgeText = '';
      }

      const selectedHalo = isSelected ? 'ring-4 ring-white ring-offset-2 ring-offset-slate-900 scale-125 z-50' : '';

      const pointIcon = L.divIcon({
        className: 'leaflet-rank-node',
        html: `
          <div class="relative -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 hover:scale-125 select-none ${selectedHalo}">
            <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs shadow-md transition-colors ${badgeClasses}">
              ${badgeText || `<span class="w-2 h-2 rounded-full bg-slate-500"></span>`}
            </div>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const marker = L.marker([pt.lat, pt.lng], {
        icon: pointIcon,
        zIndexOffset: isSelected ? 500 : 100,
      });

      // Tooltip
      const tooltipContent = `
        <div class="text-xs font-sans text-slate-900 leading-tight">
          <div class="font-bold flex items-center gap-1">
            <span>Hạng: ${pt.rankDisplay}</span>
            <span class="text-slate-500 text-[10px]">(${pt.distanceKm} km)</span>
          </div>
          <div class="text-[10px] text-slate-600">${pt.lat.toFixed(4)}, ${pt.lng.toFixed(4)}</div>
          ${pt.status === 'success' ? `<div class="text-[10px] text-indigo-700 mt-0.5">Click xem top 5 đối thủ</div>` : ''}
        </div>
      `;
      marker.bindTooltip(tooltipContent, { direction: 'top', offset: [0, -18], opacity: 0.95 });

      marker.on('click', () => {
        onSelectPoint(pt);
      });

      markersLayer.addLayer(marker);
    });
  }, [points, selectedPointId, onSelectPoint]);

  // Adjust view when center or points change significantly
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (points.length > 0) {
      const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng]));
      bounds.extend([centerLat, centerLng]);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    } else {
      map.setView([centerLat, centerLng], 13);
    }
  }, [centerLat, centerLng, points.length]);

  return (
    <div className="relative w-full h-full min-h-[420px] rounded-xl overflow-hidden shadow-inner border border-slate-800 bg-slate-900">
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Picking center mode banner */}
      {isPickingCenter && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] bg-indigo-600/95 text-white text-xs font-medium px-4 py-2 rounded-full shadow-xl border border-indigo-400 flex items-center gap-2 backdrop-blur animate-bounce">
          <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
          <span>Click bất kỳ điểm nào trên bản đồ để chọn tâm quét mới</span>
        </div>
      )}

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 z-[400] bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-lg p-2.5 shadow-xl text-xs text-slate-300 pointer-events-auto">
        <div className="font-semibold text-[11px] text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
          Chú giải xếp hạng Google Maps
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-[9px] shadow-sm">1-3</span>
            <span>Top 3 (Local Pack)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-[9px] shadow-sm">4-10</span>
            <span>Top 4 - 10</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center font-bold text-[9px] shadow-sm">11-20</span>
            <span>Top 11 - 20</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-slate-700 text-slate-300 border border-slate-500 flex items-center justify-center font-bold text-[9px] shadow-sm">20+</span>
            <span>Ngoài top 20</span>
          </div>
        </div>
      </div>
    </div>
  );
};
