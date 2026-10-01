import React, { useState, useMemo, useRef } from 'react';
import {
  Globe,
  Shield,
  AlertTriangle,
  Flame,
  Radio,
  ExternalLink,
  Copy,
  Check,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Eye,
  EyeOff,
  Crosshair,
  Server,
  Layers,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { Incident, SeverityLevel, IncidentStatus } from '../types/security';
import {
  extractGeoThreatPoints,
  geoToSvgCoords,
  calculateAttackCurve,
  ENTERPRISE_SOC_TARGET,
  GeoThreatPoint,
} from '../services/threatGeoService';
import {
  WORLD_LANDMASS_PATHS,
  GRATICULE_MERIDIANS,
  GRATICULE_PARALLELS,
  SPECIAL_LATITUDES,
} from './worldMapData';

interface ThreatOriginMapWidgetProps {
  incidents: Incident[];
  onNavigateToIncidents?: () => void;
}

const SEVERITY_COLORS: Record<SeverityLevel, { hex: string; bg: string; border: string; glow: string }> = {
  critical: {
    hex: '#f43f5e',
    bg: 'rgba(244, 63, 94, 0.15)',
    border: 'rgba(244, 63, 94, 0.6)',
    glow: 'rgba(244, 63, 94, 0.4)',
  },
  high: {
    hex: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.15)',
    border: 'rgba(245, 158, 11, 0.6)',
    glow: 'rgba(245, 158, 11, 0.4)',
  },
  medium: {
    hex: '#06b6d4',
    bg: 'rgba(6, 182, 212, 0.15)',
    border: 'rgba(6, 182, 212, 0.6)',
    glow: 'rgba(6, 182, 212, 0.4)',
  },
  low: {
    hex: '#94a3b8',
    bg: 'rgba(148, 163, 184, 0.15)',
    border: 'rgba(148, 163, 184, 0.6)',
    glow: 'rgba(148, 163, 184, 0.4)',
  },
};

export const ThreatOriginMapWidget: React.FC<ThreatOriginMapWidgetProps> = ({
  incidents,
  onNavigateToIncidents,
}) => {
  // State for interactive controls
  const [severityFilter, setSeverityFilter] = useState<'all' | SeverityLevel>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'resolved'>('all');
  const [showAttackArcs, setShowAttackArcs] = useState(true);
  const [selectedPoint, setSelectedPoint] = useState<GeoThreatPoint | null>(null);
  const [copiedIp, setCopiedIp] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [simulatedPingsCount, setSimulatedPingsCount] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);

  // Target enterprise coordinates (Santo Domingo Datacenter)
  const targetCoords = useMemo(
    () => geoToSvgCoords(ENTERPRISE_SOC_TARGET.lat, ENTERPRISE_SOC_TARGET.lon),
    []
  );

  // Extract all threat points from incident data
  const rawPoints = useMemo(() => extractGeoThreatPoints(incidents), [incidents]);

  // Filtered threat points based on user selections
  const filteredPoints = useMemo(() => {
    return rawPoints.filter((point) => {
      const matchesSeverity = severityFilter === 'all' || point.severity === severityFilter;
      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'active'
          ? point.status === 'open' || point.status === 'investigating'
          : point.status === 'resolved';

      return matchesSeverity && matchesStatus;
    });
  }, [rawPoints, severityFilter, statusFilter]);

  // Aggregate country statistics
  const countryBreakdown = useMemo(() => {
    const map: Record<
      string,
      { count: number; countryCode: string; severities: Record<SeverityLevel, number>; criticalCount: number }
    > = {};

    filteredPoints.forEach((pt) => {
      if (!map[pt.country]) {
        map[pt.country] = {
          count: 0,
          countryCode: pt.countryCode,
          severities: { critical: 0, high: 0, medium: 0, low: 0 },
          criticalCount: 0,
        };
      }
      map[pt.country].count += 1;
      map[pt.country].severities[pt.severity] += 1;
      if (pt.severity === 'critical') {
        map[pt.country].criticalCount += 1;
      }
    });

    return Object.entries(map)
      .map(([country, stats]) => ({
        country,
        ...stats,
      }))
      .sort((a, b) => b.count - a.count || b.criticalCount - a.criticalCount);
  }, [filteredPoints]);

  // Stats summaries
  const criticalThreatsCount = useMemo(
    () => filteredPoints.filter((p) => p.severity === 'critical').length,
    [filteredPoints]
  );
  const uniqueCountriesCount = useMemo(
    () => new Set(filteredPoints.map((p) => p.country)).size,
    [filteredPoints]
  );
  const activeAttacksCount = useMemo(
    () => filteredPoints.filter((p) => p.status !== 'resolved').length,
    [filteredPoints]
  );

  const handleCopyIp = (ip: string) => {
    navigator.clipboard.writeText(ip);
    setCopiedIp(ip);
    setTimeout(() => setCopiedIp(null), 2200);
  };

  const handleTriggerTelemetrySimulation = () => {
    setIsSimulating(true);
    setSimulatedPingsCount((prev) => prev + 1);
    setTimeout(() => {
      setIsSimulating(false);
    }, 1200);
  };

  const handleZoomIn = () => setZoomLevel((z) => Math.min(2.5, +(z + 0.25).toFixed(2)));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(0.85, +(z - 0.25).toFixed(2)));
  const handleResetZoom = () => {
    setZoomLevel(1);
    setSelectedPoint(null);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded p-5 space-y-4">
      {/* 1. Header Zone: Title, Description & Action Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-cyan-950/80 border border-cyan-800/80 text-cyan-400">
              <Globe className="w-4 h-4" />
            </span>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Geolocalización de Origen de Amenazas Globales
            </h3>
            <span className="text-[10px] font-mono text-cyan-400 px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/50">
              SOC Geospatial Radar
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Mapeo interactivo en tiempo real de nodos hostiles, orígenes C2 y vectores de ataque correlacionados con la cartera de incidentes
          </p>
        </div>

        {/* Global Key Metrics Badges */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-xs font-mono">
            <span className="text-slate-400">Orígenes:</span>
            <span className="font-bold text-white tabular-nums">{filteredPoints.length}</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">Países:</span>
            <span className="font-bold text-cyan-400 tabular-nums">{uniqueCountriesCount}</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">Críticos:</span>
            <span className="font-bold text-rose-400 tabular-nums">{criticalThreatsCount}</span>
          </div>

          <button
            onClick={handleTriggerTelemetrySimulation}
            disabled={isSimulating}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-cyan-300 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-800/80 rounded transition-colors whitespace-nowrap cursor-pointer shadow-sm shadow-cyan-950"
            title="Simular sondeo perimetral de telemetría geoespacial"
          >
            <Radio className={`w-3.5 h-3.5 text-cyan-400 ${isSimulating ? 'animate-spin' : 'animate-pulse'}`} />
            <span>{isSimulating ? 'Sondeando Nodos...' : 'Actualizar Telemetría'}</span>
          </button>
        </div>
      </div>

      {/* 2. Interactive Filter Bar & Viewport Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/90 border border-slate-800/80 rounded p-2 text-xs">
        {/* Severity Filter Tabs */}
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-slate-400 font-mono text-[11px] mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3 text-slate-500" />
            Severidad:
          </span>
          {(['all', 'critical', 'high', 'medium', 'low'] as const).map((sev) => {
            const isActive = severityFilter === sev;
            const labels = {
              all: 'Todas',
              critical: 'Críticas',
              high: 'Altas',
              medium: 'Medias',
              low: 'Bajas',
            };
            return (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-2.5 py-1 text-[11px] font-mono rounded transition-colors ${
                  isActive
                    ? 'bg-slate-800 text-white font-semibold border border-slate-700 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                {labels[sev]}
              </button>
            );
          })}
        </div>

        {/* Status Filter & Vectors Toggle & Zoom */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Status selector */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded p-0.5 font-mono text-[11px]">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2 py-0.5 rounded transition-colors ${
                statusFilter === 'all' ? 'bg-cyan-950 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Todos ({rawPoints.length})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-2 py-0.5 rounded transition-colors ${
                statusFilter === 'active' ? 'bg-rose-950 text-rose-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Activos ({rawPoints.filter((p) => p.status !== 'resolved').length})
            </button>
            <button
              onClick={() => setStatusFilter('resolved')}
              className={`px-2 py-0.5 rounded transition-colors ${
                statusFilter === 'resolved' ? 'bg-emerald-950 text-emerald-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Resueltos ({rawPoints.filter((p) => p.status === 'resolved').length})
            </button>
          </div>

          {/* Toggle Trajectory Arcs */}
          <button
            onClick={() => setShowAttackArcs(!showAttackArcs)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded border text-[11px] font-mono transition-colors ${
              showAttackArcs
                ? 'bg-cyan-950/70 border-cyan-800/80 text-cyan-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Alternar visualización de trayectorias balísticas hacia el datacenter"
          >
            {showAttackArcs ? <Eye className="w-3 h-3 text-cyan-400" /> : <EyeOff className="w-3 h-3 text-slate-500" />}
            <span>Trayectorias</span>
          </button>

          {/* Zoom controls */}
          <div className="flex items-center gap-1 border border-slate-800 rounded bg-slate-900 px-1 py-0.5 text-slate-300">
            <button
              onClick={handleZoomIn}
              className="p-1 hover:text-cyan-400 rounded transition-colors"
              title="Aumentar zoom"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono px-1 tabular-nums text-slate-400">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={handleZoomOut}
              className="p-1 hover:text-cyan-400 rounded transition-colors"
              title="Reducir zoom"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-1 hover:text-amber-400 rounded transition-colors border-l border-slate-800 ml-0.5 pl-1"
              title="Restablecer vista global"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Main Geospatial Visualization Grid: Map Canvas + Live Threat Origin Intelligence Drawer */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        {/* World Map SVG Viewport */}
        <div className="xl:col-span-3 relative bg-slate-950 border border-slate-800 rounded overflow-hidden select-none min-h-[380px] lg:min-h-[440px] flex items-center justify-center">
          {/* Subtle radar overlay indicator */}
          <div className="absolute top-2 left-3 z-10 flex items-center gap-2 pointer-events-none">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span className="text-[11px] font-mono text-slate-400">
              Vigilancia Activa de Vectores IP · Proyección Cilíndrica Equirrectangular
            </span>
          </div>

          <div className="absolute top-2 right-3 z-10 flex items-center gap-2 pointer-events-none text-[10px] font-mono text-slate-400">
            <span>Objetivo Protegido: Santo Domingo DC (18.48°N, 69.93°W)</span>
          </div>

          {/* SVG Map Canvas */}
          <div
            className="w-full h-full flex items-center justify-center transition-transform duration-300 ease-out"
            style={{
              transform: `scale(${zoomLevel})`,
              transformOrigin: '50% 50%',
            }}
          >
            <svg
              viewBox="0 0 1000 500"
              className="w-full h-full max-h-[520px]"
              style={{ filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.6))' }}
            >
              <defs>
                {/* Cyber Grid Pattern */}
                <pattern id="socGrid" width="25" height="25" patternUnits="userSpaceOnUse">
                  <path d="M 25 0 L 0 0 0 25" fill="none" stroke="rgba(30, 41, 59, 0.45)" strokeWidth="0.5" />
                </pattern>

                {/* Radar Sweep Radial Gradient */}
                <radialGradient id="targetHalo" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
                  <stop offset="60%" stopColor="#06b6d4" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                </radialGradient>

                {/* Threat Point Halos */}
                <radialGradient id="criticalHalo" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.9" />
                  <stop offset="70%" stopColor="#f43f5e" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
                </radialGradient>

                <radialGradient id="highHalo" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.9" />
                  <stop offset="70%" stopColor="#f59e0b" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                </radialGradient>

                {/* Trajectory linear gradients */}
                <linearGradient id="attackArcGradCritical" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.95" />
                  <stop offset="60%" stopColor="#fb7185" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.9" />
                </linearGradient>

                <linearGradient id="attackArcGradHigh" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.9" />
                  <stop offset="60%" stopColor="#fbbf24" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.8" />
                </linearGradient>

                <linearGradient id="attackArcGradMedium" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.5" />
                </linearGradient>
              </defs>

              {/* Grid Background */}
              <rect x="0" y="0" width="1000" height="500" fill="#040813" />
              <rect x="0" y="0" width="1000" height="500" fill="url(#socGrid)" />

              {/* Graticule Parallels (Latitudes) */}
              {GRATICULE_PARALLELS.map((lat) => {
                const y = ((90 - lat) / 180) * 500;
                return (
                  <line
                    key={`par-${lat}`}
                    x1="0"
                    y1={y}
                    x2="1000"
                    y2={y}
                    stroke="rgba(51, 65, 85, 0.35)"
                    strokeWidth="0.6"
                    strokeDasharray="2 4"
                  />
                );
              })}

              {/* Graticule Meridians (Longitudes) */}
              {GRATICULE_MERIDIANS.map((lon) => {
                const x = ((lon + 180) / 360) * 1000;
                return (
                  <line
                    key={`mer-${lon}`}
                    x1={x}
                    y1="0"
                    x2={x}
                    y2="500"
                    stroke="rgba(51, 65, 85, 0.35)"
                    strokeWidth="0.6"
                    strokeDasharray="2 4"
                  />
                );
              })}

              {/* Reference Latitudes (Equator, Tropics) */}
              {SPECIAL_LATITUDES.map((spec) => {
                const y = ((90 - spec.lat) / 180) * 500;
                return (
                  <g key={`spec-${spec.name}`}>
                    <line
                      x1="0"
                      y1={y}
                      x2="1000"
                      y2={y}
                      stroke={spec.stroke}
                      strokeWidth={spec.lat === 0 ? '1' : '0.6'}
                      strokeDasharray={spec.dash}
                    />
                    <text
                      x="10"
                      y={y - 3}
                      fill="rgba(148, 163, 184, 0.45)"
                      fontSize="7"
                      fontFamily="monospace"
                    >
                      {spec.lat === 0 ? 'ECUADOR 0°' : spec.lat > 0 ? `${spec.lat}°N` : `${Math.abs(spec.lat)}°S`}
                    </text>
                  </g>
                );
              })}

              {/* World Landmasses */}
              <g id="landmasses">
                {WORLD_LANDMASS_PATHS.map((polygon) => (
                  <path
                    key={polygon.id}
                    d={polygon.path}
                    fill="#0d1b31"
                    stroke="#1e3a5f"
                    strokeWidth="1"
                    className="hover:fill-[#14284b] transition-colors duration-200 cursor-crosshair"
                  >
                    <title>{polygon.name}</title>
                  </path>
                ))}
              </g>

              {/* Inbound Attack Trajectory Arcs */}
              {showAttackArcs && (
                <g id="attack-arcs">
                  {filteredPoints.map((point) => {
                    const originCoords = geoToSvgCoords(point.lat, point.lon);
                    const { path } = calculateAttackCurve(originCoords, targetCoords);
                    const isSelected = selectedPoint?.incidentId === point.incidentId;
                    const strokeGrad =
                      point.severity === 'critical'
                        ? 'url(#attackArcGradCritical)'
                        : point.severity === 'high'
                        ? 'url(#attackArcGradHigh)'
                        : 'url(#attackArcGradMedium)';

                    return (
                      <g key={`arc-${point.incidentId}`} className="cursor-pointer" onClick={() => setSelectedPoint(point)}>
                        {/* Static subtle baseline curve */}
                        <path
                          d={path}
                          fill="none"
                          stroke={point.severity === 'critical' ? 'rgba(244, 63, 94, 0.25)' : 'rgba(245, 158, 11, 0.2)'}
                          strokeWidth={isSelected ? '2' : '1'}
                        />

                        {/* Animated flowing malicious packets curve */}
                        <path
                          d={path}
                          fill="none"
                          stroke={strokeGrad}
                          strokeWidth={isSelected ? '2.5' : '1.5'}
                          strokeDasharray="6 8"
                          className="animate-attack-flow"
                          style={{
                            animationDuration: point.severity === 'critical' ? '1.2s' : '2.0s',
                            filter: isSelected ? 'drop-shadow(0 0 6px rgba(244, 63, 94, 0.8))' : 'none',
                          }}
                        />
                      </g>
                    );
                  })}
                </g>
              )}

              {/* Target Protected Datacenter: Santo Domingo HQ */}
              <g id="target-asset" transform={`translate(${targetCoords.x}, ${targetCoords.y})`}>
                {/* Target pulsating radar circles */}
                <circle r="22" fill="url(#targetHalo)" />
                <circle
                  r="14"
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="1.2"
                  strokeDasharray="2 2"
                  className="animate-spin"
                  style={{ animationDuration: '8s', transformOrigin: '0 0' }}
                />
                <circle r="7" fill="#083344" stroke="#06b6d4" strokeWidth="2" />
                <circle r="2.5" fill="#38bdf8" />

                {/* Target Label */}
                <g transform="translate(12, 4)" className="pointer-events-none">
                  <rect
                    x="-2"
                    y="-11"
                    width="118"
                    height="16"
                    rx="3"
                    fill="#041220"
                    stroke="#0e7490"
                    strokeWidth="0.8"
                    fillOpacity="0.9"
                  />
                  <text x="3" y="1" fill="#38bdf8" fontSize="8" fontWeight="bold" fontFamily="monospace">
                    DATACENTER HQ [DOM]
                  </text>
                </g>
              </g>

              {/* Threat Origin Markers */}
              <g id="threat-origin-points">
                {filteredPoints.map((point) => {
                  const coords = geoToSvgCoords(point.lat, point.lon);
                  const isSelected = selectedPoint?.incidentId === point.incidentId;
                  const sevColor = SEVERITY_COLORS[point.severity];

                  return (
                    <g
                      key={`pt-${point.incidentId}`}
                      transform={`translate(${coords.x}, ${coords.y})`}
                      className="cursor-pointer group"
                      onClick={() => setSelectedPoint(point)}
                    >
                      {/* Pulsating Halo Circle for critical / high threats */}
                      {(point.severity === 'critical' || point.severity === 'high') && (
                        <circle
                          r={isSelected ? '24' : '16'}
                          fill={point.severity === 'critical' ? 'url(#criticalHalo)' : 'url(#highHalo)'}
                          className="animate-ping"
                          style={{
                            animationDuration: point.severity === 'critical' ? '2.2s' : '3.5s',
                            opacity: 0.7,
                          }}
                        />
                      )}

                      {/* Concentric target ring */}
                      <circle
                        r={isSelected ? '10' : '6.5'}
                        fill={sevColor.bg}
                        stroke={sevColor.hex}
                        strokeWidth={isSelected ? '2' : '1.2'}
                        style={{
                          filter: isSelected ? `drop-shadow(0 0 8px ${sevColor.hex})` : 'none',
                        }}
                      />

                      {/* Inner solid core dot */}
                      <circle r={isSelected ? '4' : '2.5'} fill={sevColor.hex} />

                      {/* Concise Origin Tag on hover or selection */}
                      {(isSelected || point.severity === 'critical') && (
                        <g transform="translate(8, -8)" className="pointer-events-none">
                          <rect
                            x="-2"
                            y="-9"
                            width={point.ip.length * 6.5 + 24}
                            height="14"
                            rx="2"
                            fill="#090d16"
                            stroke={sevColor.hex}
                            strokeWidth="0.8"
                            fillOpacity="0.95"
                          />
                          <text x="3" y="1.5" fill="#f8fafc" fontSize="7.5" fontWeight="600" fontFamily="monospace">
                            {point.countryCode} · {point.ip}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </g>
            </svg>
          </div>

          {/* Coordinate Watermark Reference at Bottom */}
          <div className="absolute bottom-2 left-3 z-10 text-[10px] font-mono text-slate-400 flex items-center gap-3">
            <span>Sensores EDR / NDR Activos</span>
            <span>·</span>
            <span>WGS-84 Normalizado</span>
          </div>

          {/* Quick Clear Selection button if selected */}
          {selectedPoint && (
            <button
              onClick={() => setSelectedPoint(null)}
              className="absolute top-2 right-2 z-20 px-2 py-1 rounded bg-slate-900/90 border border-slate-700 text-[10px] font-mono text-slate-300 hover:text-white"
            >
              Cerrar Detalle [X]
            </button>
          )}
        </div>

        {/* Tactical Threat Intelligence Inspector & Origins Feed */}
        <div className="space-y-4 flex flex-col justify-between">
          {/* Detail card for currently selected point, OR default top active threat preview */}
          {selectedPoint ? (
            <div className="bg-slate-950 border border-cyan-800/80 rounded p-4 space-y-3 shadow-md shadow-cyan-950/40">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Inspección de Nodo Hostil</span>
                </span>
                <span
                  className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded font-bold ${
                    selectedPoint.severity === 'critical'
                      ? 'bg-rose-950 text-rose-300 border border-rose-800'
                      : selectedPoint.severity === 'high'
                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                      : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                  }`}
                >
                  {selectedPoint.severity}
                </span>
              </div>

              {/* IP & Location */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold font-mono text-white tracking-wide">
                    {selectedPoint.ip}
                  </span>
                  <button
                    onClick={() => handleCopyIp(selectedPoint.ip)}
                    className="flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-300 font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800"
                    title="Copiar dirección IP de origen"
                  >
                    {copiedIp === selectedPoint.ip ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedIp === selectedPoint.ip ? 'Copiada' : 'Copiar'}</span>
                  </button>
                </div>
                <div className="text-xs text-slate-300 flex items-center gap-1.5 font-medium">
                  <span className="text-cyan-400 font-mono">[{selectedPoint.countryCode}]</span>
                  <span>{selectedPoint.city}, {selectedPoint.country}</span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  {selectedPoint.lat.toFixed(4)}°N, {selectedPoint.lon.toFixed(4)}°W
                </div>
              </div>

              {/* ASN & Actor */}
              <div className="p-2 rounded bg-slate-900/90 border border-slate-800 text-[11px] space-y-1">
                <div className="text-slate-400 font-mono text-[10px]">AUTONOMOUS SYSTEM / ISP:</div>
                <div className="text-slate-200 font-mono truncate" title={selectedPoint.asn}>
                  {selectedPoint.asn || 'No anunciado públicamente'}
                </div>
                {selectedPoint.threatActor && (
                  <div className="text-rose-400 font-mono text-[11px] pt-1 border-t border-slate-800/60">
                    Clúster: {selectedPoint.threatActor}
                  </div>
                )}
              </div>

              {/* Targeted Asset */}
              <div className="text-[11px] space-y-1">
                <div className="text-slate-400 flex items-center justify-between">
                  <span>Activo Objetivo Vulnerado:</span>
                  <span className="font-mono text-cyan-300">{selectedPoint.assetIp}</span>
                </div>
                <div className="font-semibold text-slate-200">{selectedPoint.assetName}</div>
                <div className="text-[11px] text-slate-400 font-mono">Vector: {selectedPoint.attackVector}</div>
              </div>

              {/* Action to Jump to Incident */}
              {onNavigateToIncidents && (
                <button
                  onClick={onNavigateToIncidents}
                  className="w-full mt-2 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-800 text-xs font-semibold text-cyan-300 transition-colors"
                >
                  <span>Ver Ficha en Módulo de Incidentes</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            /* Default Tactical Summary Card when no node is selected */
            <div className="bg-slate-950 border border-slate-800 rounded p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Resumen de Protección Perimetral</span>
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-300 font-mono">
                  <span>Nodos Hostiles Activos:</span>
                  <span className="text-rose-400 font-bold tabular-nums">{activeAttacksCount}</span>
                </div>
                <div className="flex justify-between items-center text-slate-300 font-mono">
                  <span>Países de Origen Únicos:</span>
                  <span className="text-cyan-400 font-bold tabular-nums">{uniqueCountriesCount}</span>
                </div>
                <div className="flex justify-between items-center text-slate-300 font-mono">
                  <span>Protección DNS Sinkhole:</span>
                  <span className="text-emerald-400 font-bold">Activa (Regla EDR)</span>
                </div>
                <div className="flex justify-between items-center text-slate-300 font-mono">
                  <span>Filtro GeoIP Perimetral:</span>
                  <span className="text-cyan-400 font-bold">BGP Scrubbing</span>
                </div>
              </div>

              <div className="p-2 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
                Selecciona cualquier nodo o vector balístico en el mapa para inspeccionar el informe forense del atacante.
              </div>
            </div>
          )}

          {/* Top Attack Origin Countries Ranking */}
          <div className="bg-slate-950 border border-slate-800 rounded p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-[11px] font-mono text-slate-300 uppercase tracking-wider font-semibold">
                Principales Países de Origen
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {countryBreakdown.length} detectados
              </span>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {countryBreakdown.length === 0 ? (
                <div className="text-xs text-slate-400 text-center py-4">
                  No hay orígenes que coincidan con los filtros.
                </div>
              ) : (
                countryBreakdown.map((item) => {
                  const pct = Math.round((item.count / filteredPoints.length) * 100) || 0;
                  const hasCritical = item.criticalCount > 0;

                  return (
                    <div
                      key={item.country}
                      className="p-1.5 rounded bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-colors text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between font-mono">
                        <span className="flex items-center gap-1.5 text-slate-200">
                          <span className="text-cyan-400 font-bold text-[10px]">[{item.countryCode}]</span>
                          <span className="truncate max-w-[120px]" title={item.country}>
                            {item.country}
                          </span>
                        </span>
                        <div className="flex items-center gap-2">
                          {hasCritical && (
                            <span className="text-[9px] font-bold text-rose-400 bg-rose-950 px-1 rounded border border-rose-800/60">
                              {item.criticalCount} crit
                            </span>
                          )}
                          <span className="font-bold text-white tabular-nums">{item.count}</span>
                        </div>
                      </div>

                      {/* Small progress meter */}
                      <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            hasCritical ? 'bg-rose-500' : 'bg-cyan-500'
                          } transition-all duration-300`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Live Inbound Threat Feed Ticker (Recent Incidents by Origin IP) */}
      <div className="border-t border-slate-800 pt-3">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-2">
          <span className="flex items-center gap-1.5 uppercase font-semibold text-slate-300">
            <Radio className="w-3.5 h-3.5 text-rose-400" />
            Flujo de Amenazas Geolocalizadas Recientes
          </span>
          <span>{filteredPoints.length} incidentes correlacionados con telemetría IP</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
          {filteredPoints.slice(0, 4).map((pt) => (
            <div
              key={`feed-${pt.incidentId}`}
              onClick={() => setSelectedPoint(pt)}
              className={`p-2.5 rounded bg-slate-950 border transition-all cursor-pointer hover:border-cyan-500/60 ${
                selectedPoint?.incidentId === pt.incidentId
                  ? 'border-cyan-400 ring-1 ring-cyan-500/30'
                  : 'border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                <span className="text-cyan-400 font-bold">[{pt.countryCode}] {pt.country}</span>
                <span
                  className={`uppercase font-bold ${
                    pt.severity === 'critical' ? 'text-rose-400' : pt.severity === 'high' ? 'text-amber-400' : 'text-cyan-400'
                  }`}
                >
                  {pt.severity}
                </span>
              </div>
              <div className="text-xs font-mono font-bold text-white truncate" title={pt.ip}>
                {pt.ip}
              </div>
              <div className="text-[11px] text-slate-400 truncate mt-0.5" title={pt.incidentTitle}>
                {pt.incidentTitle}
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-1 flex justify-between">
                <span>Objetivo: {pt.assetName}</span>
                <span className="text-cyan-400">Ver nodo</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
