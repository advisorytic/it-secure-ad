import React, { useState, useMemo } from 'react';
import {
  AlertOctagon,
  Plus,
  Download,
  Search,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ArrowRight,
  FileDown,
  ExternalLink,
  Bug,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Wrench,
  Activity,
  Globe,
  BellRing,
  Mail,
  Phone,
  Send,
  Smartphone,
} from 'lucide-react';
import { Incident, IncidentStatus, SeverityLevel } from '../types/security';
import { exportToCsv } from '../services/securityEngine';
import { resolveIpGeolocation } from '../services/threatGeoService';
import { dispatchIncidentNotification } from '../services/notificationService';

interface IncidentsViewProps {
  incidents: Incident[];
  onCreateIncident: (incident: Omit<Incident, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateStatus: (id: string, status: IncidentStatus) => void;
  onExportPdf?: () => void;
  onOpenNotificationModal?: () => void;
}

export const IncidentsView: React.FC<IncidentsViewProps> = ({
  incidents,
  onCreateIncident,
  onUpdateStatus,
  onExportPdf,
  onOpenNotificationModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | IncidentStatus>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedCveId, setExpandedCveId] = useState<string | null>(null);
  const [copiedVector, setCopiedVector] = useState<string | null>(null);
  const [dispatchedAlerts, setDispatchedAlerts] = useState<Record<string, string>>({});
  const [isDispatching, setIsDispatching] = useState<string | null>(null);

  const handleManualDispatch = async (inc: Incident) => {
    setIsDispatching(inc.id);
    const res = await dispatchIncidentNotification(inc, 'manual');
    setIsDispatching(null);
    if (res.success) {
      setDispatchedAlerts((prev) => ({
        ...prev,
        [inc.id]: `Alerta despachada a: ${res.notificationSummary}`,
      }));
      setTimeout(() => {
        setDispatchedAlerts((prev) => {
          const next = { ...prev };
          delete next[inc.id];
          return next;
        });
      }, 5000);
    }
  };

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    category: 'Acceso no autorizado',
    description: '',
    assetName: '',
    assetIp: '',
    threatOriginIp: '',
    severity: 'high' as SeverityLevel,
    cveId: '',
    cvssScore: '' as string | number,
    cvssVector: '',
    mitreTechnique: '',
    cveRemediation: '',
  });

  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        inc.title.toLowerCase().includes(q) ||
        inc.description.toLowerCase().includes(q) ||
        inc.assetName.toLowerCase().includes(q) ||
        inc.assetIp.toLowerCase().includes(q) ||
        (inc.threatOriginIp && inc.threatOriginIp.toLowerCase().includes(q)) ||
        (inc.cveId && inc.cveId.toLowerCase().includes(q)) ||
        (inc.mitreTechnique && inc.mitreTechnique.toLowerCase().includes(q));
      const matchesStatus = statusFilter === 'all' || inc.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [incidents, searchTerm, statusFilter]);

  const handleCopyVector = (vector: string, id: string) => {
    navigator.clipboard.writeText(vector);
    setCopiedVector(id);
    setTimeout(() => setCopiedVector(null), 2000);
  };

  const handleSubmitCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) return;

    const parsedScore = formData.cvssScore !== '' ? parseFloat(String(formData.cvssScore)) : undefined;
    const originIp = formData.threatOriginIp.trim();
    const geo = originIp ? resolveIpGeolocation(originIp) : undefined;

    onCreateIncident({
      title: formData.title.trim(),
      category: formData.category.trim(),
      description: formData.description.trim(),
      assetName: formData.assetName.trim(),
      assetIp: formData.assetIp.trim(),
      severity: formData.severity,
      status: 'open',
      reportedBy: 'Analista de Seguridad SOC',
      cveId: formData.cveId.trim() || undefined,
      cvssScore: Number.isFinite(parsedScore) ? parsedScore : undefined,
      cvssVector: formData.cvssVector.trim() || undefined,
      mitreTechnique: formData.mitreTechnique.trim() || undefined,
      cveRemediation: formData.cveRemediation.trim() || undefined,
      threatOriginIp: originIp || undefined,
      threatOriginCountry: geo?.country,
      threatOriginCountryCode: geo?.countryCode,
      threatOriginCity: geo?.city,
      threatOriginLat: geo?.lat,
      threatOriginLon: geo?.lon,
      threatOriginAsn: geo?.asn,
      threatActor: geo?.threatActor,
    });

    setFormData({
      title: '',
      category: 'Acceso no autorizado',
      description: '',
      assetName: '',
      assetIp: '',
      threatOriginIp: '',
      severity: 'high',
      cveId: '',
      cvssScore: '',
      cvssVector: '',
      mitreTechnique: '',
      cveRemediation: '',
    });
    setShowCreateModal(false);
  };

  const handleExportCsv = () => {
    const exportable = incidents.map((inc) => ({
      ID: inc.id,
      Titulo: inc.title,
      Categoria: inc.category,
      Severidad: inc.severity,
      Estado: inc.status,
      Activo: inc.assetName,
      IP_Activo: inc.assetIp,
      CVE_ID: inc.cveId || 'N/A',
      CVSS_Score: inc.cvssScore ?? 'N/A',
      CVSS_Vector: inc.cvssVector || 'N/A',
      Tecnica_MITRE: inc.mitreTechnique || 'N/A',
      ReportadoPor: inc.reportedBy,
      FechaCreacion: inc.createdAt,
      FechaActualizacion: inc.updatedAt,
      Descripcion: inc.description,
      Remediacion_Recomendada: inc.cveRemediation || 'N/A',
    }));
    exportToCsv(exportable, 'registro-de-incidencias-cve');
  };

  const getCvssBadgeStyle = (score?: number) => {
    if (score === undefined || score === null) return 'text-slate-400 bg-slate-800 border-slate-700';
    if (score >= 9.0) return 'text-rose-300 bg-rose-950/80 border-rose-700/80';
    if (score >= 7.0) return 'text-amber-300 bg-amber-950/80 border-amber-700/80';
    if (score >= 4.0) return 'text-cyan-300 bg-cyan-950/80 border-cyan-700/80';
    return 'text-slate-300 bg-slate-800 border-slate-700';
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-900/60 p-4 border border-slate-800 rounded">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por título, activo, CVE (ej. CVE-2021) o MITRE..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-500/50 font-mono"
            />
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded">
            {(['all', 'open', 'investigating', 'resolved'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                  statusFilter === st
                    ? 'bg-slate-800 text-cyan-300 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st === 'all'
                  ? 'Todas'
                  : st === 'open'
                  ? 'Abiertas'
                  : st === 'investigating'
                  ? 'En Curso'
                  : 'Resueltas'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenNotificationModal && (
            <button
              onClick={onOpenNotificationModal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-300 bg-amber-950/70 hover:bg-amber-900/80 border border-amber-800/80 rounded transition-colors whitespace-nowrap shadow-sm shadow-amber-950/50 group"
              title="Configurar y probar canales de alerta (rramirez@carioca.com.do · 849-889-3423)"
            >
              <BellRing className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
              <span>Canales de Alerta</span>
              <span className="hidden xl:inline text-[11px] font-mono text-amber-400/80 font-normal">
                (rramirez@carioca.com.do · 849-889-3423)
              </span>
            </button>
          )}

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded transition-colors whitespace-nowrap shadow-sm shadow-cyan-500/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Crear Incidencia</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors whitespace-nowrap"
            title="Exportar a CSV con datos CVE/CVSS"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Exportar CSV</span>
          </button>

          {onExportPdf && (
            <button
              onClick={onExportPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-cyan-300 bg-cyan-950/70 hover:bg-cyan-900/80 border border-cyan-800/80 rounded transition-colors whitespace-nowrap"
              title="Descargar informe completo en formato PDF"
            >
              <FileDown className="w-3.5 h-3.5 text-cyan-400" />
              <span>Exportar PDF</span>
            </button>
          )}
        </div>
      </div>

      {/* Incidents List */}
      <div className="space-y-4">
        {filteredIncidents.length === 0 ? (
          <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded text-slate-400 text-xs">
            No hay incidencias registradas que coincidan con los filtros.
          </div>
        ) : (
          filteredIncidents.map((inc) => {
            const isExpanded = expandedCveId === inc.id;

            return (
              <div
                key={inc.id}
                className={`p-4 rounded border transition-colors bg-slate-900 ${
                  inc.severity === 'critical'
                    ? 'border-rose-900/60'
                    : inc.severity === 'high'
                    ? 'border-amber-900/60'
                    : 'border-slate-800'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    {/* Header line: Severity badge, Title, ID, Category */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[10px] font-mono uppercase px-1.5 py-0.2 rounded border font-semibold ${
                          inc.severity === 'critical'
                            ? 'text-rose-400 border-rose-800/80 bg-rose-950/60'
                            : inc.severity === 'high'
                            ? 'text-amber-400 border-amber-800/80 bg-amber-950/60'
                            : 'text-cyan-400 border-cyan-800/80 bg-cyan-950/60'
                        }`}
                      >
                        {inc.severity}
                      </span>

                      <span className="text-xs font-bold text-slate-100">
                        {inc.title}
                      </span>

                      <span className="text-[11px] text-slate-400 font-mono">
                        (ID: {inc.id} · {inc.category})
                      </span>
                    </div>

                    {/* CVE / CVSS Correlated Badges Callout */}
                    {(inc.cveId || inc.cvssScore !== undefined) && (
                      <div className="flex items-center gap-2.5 flex-wrap pt-0.5">
                        {inc.cveId && (
                          <a
                            href={
                              inc.cveId.startsWith('CVE-')
                                ? `https://nvd.nist.gov/vuln/detail/${inc.cveId}`
                                : `https://cwe.mitre.org/data/definitions/${inc.cveId.replace(/\D/g, '')}.html`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-semibold text-rose-300 bg-rose-950/70 border border-rose-800/80 hover:bg-rose-900/60 transition-colors group"
                            title="Ver ficha oficial en el National Vulnerability Database (NIST NVD)"
                          >
                            <Bug className="w-3 h-3 text-rose-400" />
                            <span>{inc.cveId}</span>
                            <ExternalLink className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100 transition-opacity" />
                          </a>
                        )}

                        {inc.cvssScore !== undefined && (
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold border tabular-nums ${getCvssBadgeStyle(
                              inc.cvssScore
                            )}`}
                          >
                            <Activity className="w-3 h-3" />
                            <span>CVSS v3.1: {inc.cvssScore.toFixed(1)}</span>
                          </span>
                        )}

                        {inc.mitreTechnique && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono text-cyan-300 bg-cyan-950/60 border border-cyan-800/60">
                            <span>MITRE: {inc.mitreTechnique}</span>
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => setExpandedCveId(isExpanded ? null : inc.id)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
                        >
                          <span>{isExpanded ? 'Ocultar Análisis CVE' : 'Ver Análisis CVE y Remediación'}</span>
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      </div>
                    )}

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {inc.description}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1 font-mono flex-wrap">
                      <span>Activo: <strong className="text-slate-200">{inc.assetName || 'General'}</strong></span>
                      {inc.assetIp && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>IP: <strong className="text-cyan-400">{inc.assetIp}</strong></span>
                        </>
                      )}
                      {inc.threatOriginIp && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-rose-400">
                            Origen: <strong className="text-rose-300">{inc.threatOriginIp}</strong>
                            {inc.threatOriginCountry && ` (${inc.threatOriginCountry})`}
                          </span>
                        </>
                      )}
                      <span aria-hidden="true">·</span>
                      <span>Reportado por: {inc.reportedBy}</span>
                      <span aria-hidden="true">·</span>
                      <span>Creado: {new Date(inc.createdAt).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Status Switcher & Notification Action */}
                  <div className="shrink-0 flex flex-col sm:flex-row items-end sm:items-center gap-2 self-start pt-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-400">Estado:</span>
                      <select
                        value={inc.status}
                        onChange={(e) => onUpdateStatus(inc.id, e.target.value as IncidentStatus)}
                        className={`bg-slate-950 border rounded px-2.5 py-1 text-xs font-semibold focus:outline-none ${
                          inc.status === 'open'
                            ? 'text-rose-400 border-rose-800'
                            : inc.status === 'investigating'
                            ? 'text-amber-400 border-amber-800'
                            : 'text-emerald-400 border-emerald-800'
                        }`}
                      >
                        <option value="open">Abierta</option>
                        <option value="investigating">En Investigación</option>
                        <option value="resolved">Resuelta</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleManualDispatch(inc)}
                      disabled={isDispatching === inc.id}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-semibold text-amber-300 bg-amber-950/70 hover:bg-amber-900 border border-amber-800/80 transition-colors shadow-sm disabled:opacity-50"
                      title="Despachar alerta inmediata a rramirez@carioca.com.do y Tel: 849-889-3423"
                    >
                      <BellRing className={`w-3 h-3 text-amber-400 ${isDispatching === inc.id ? 'animate-bounce' : ''}`} />
                      <span>{isDispatching === inc.id ? 'Notificando...' : 'Notificar Alerta'}</span>
                    </button>
                  </div>
                </div>

                {dispatchedAlerts[inc.id] && (
                  <div className="mt-2 p-2 bg-emerald-950/70 border border-emerald-500/50 rounded flex items-center gap-2 text-[11px] text-emerald-300 animate-fade-in">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{dispatchedAlerts[inc.id]}</span>
                  </div>
                )}

                {/* Expandable CVE, CVSS & MITRE Remediation Drawer */}
                {isExpanded && (inc.cveId || inc.cvssVector || inc.cveDescription || inc.cveRemediation) && (
                  <div className="mt-3 pt-3 border-t border-slate-800/80 bg-slate-950/70 p-3.5 rounded border border-slate-800 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-cyan-300 font-bold uppercase tracking-wider text-[11px]">
                        <Bug className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Ficha Técnica de Vulnerabilidad Correlacionada</span>
                      </div>
                      {inc.cveId && (
                        <span className="text-[11px] font-mono text-slate-400">
                          ID Oficial: <strong className="text-rose-300">{inc.cveId}</strong>
                        </span>
                      )}
                    </div>

                    {inc.cveDescription && (
                      <p className="text-slate-300 leading-relaxed text-[11px] font-mono">
                        {inc.cveDescription}
                      </p>
                    )}

                    {inc.cvssVector && (
                      <div className="p-2.5 rounded bg-slate-900 border border-slate-800 flex items-center justify-between gap-3 text-[11px] font-mono">
                        <div className="truncate">
                          <span className="text-slate-400 block text-[10px] uppercase font-semibold">Vector de Ataque CVSS v3.1:</span>
                          <span className="text-cyan-300 select-all truncate">{inc.cvssVector}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyVector(inc.cvssVector!, inc.id)}
                          className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors shrink-0 text-[10px]"
                        >
                          {copiedVector === inc.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span>Copiado</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-slate-400" />
                              <span>Copiar Vector</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {inc.cveRemediation && (
                      <div className="p-3 rounded bg-emerald-950/30 border border-emerald-900/60 text-emerald-200 text-xs space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-emerald-300 text-[11px] uppercase tracking-wider">
                          <Wrench className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Remediación Técnica Recomendada:</span>
                        </div>
                        <p className="text-slate-200 leading-relaxed text-[11px]">
                          {inc.cveRemediation}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Create Incident */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-cyan-400" />
                <span>Registrar Nueva Incidencia con Correlación CVE</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitCreate} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Título de la Incidencia *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Explotación de servicio SMB / EternalBlue"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-500/60"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Categoría
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500/60"
                  >
                    <option value="Acceso no autorizado">Acceso no autorizado</option>
                    <option value="Persistencia / Malware">Persistencia / Malware</option>
                    <option value="Shadow IT / Acceso Remoto">Shadow IT / Acceso Remoto</option>
                    <option value="Transporte inseguro">Transporte inseguro</option>
                    <option value="Criptografía / Certificados">Criptografía / Certificados</option>
                    <option value="Fuga de Información">Fuga de Información</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Nivel de Severidad
                  </label>
                  <select
                    value={formData.severity}
                    onChange={(e) =>
                      setFormData({ ...formData, severity: e.target.value as SeverityLevel })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500/60"
                  >
                    <option value="critical">Crítica</option>
                    <option value="high">Alta</option>
                    <option value="medium">Media</option>
                    <option value="low">Baja</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Nombre del Activo
                  </label>
                  <input
                    type="text"
                    placeholder="DC01-CARIOCA"
                    value={formData.assetName}
                    onChange={(e) => setFormData({ ...formData, assetName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-500/60 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Dirección IP del Activo
                  </label>
                  <input
                    type="text"
                    placeholder="10.0.0.22"
                    value={formData.assetIp}
                    onChange={(e) => setFormData({ ...formData, assetIp: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-500/60 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-rose-400" />
                    <span>IP de Origen de Amenaza / C2 / Host Atacante (Opcional)</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Geolocalización en mapa SOC</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej: 185.220.101.5 o 194.26.29.112 (Pública o Interna)"
                  value={formData.threatOriginIp}
                  onChange={(e) => setFormData({ ...formData, threatOriginIp: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-rose-300 placeholder-slate-500 focus:outline-none focus:border-rose-500/60 font-mono"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Se correlacionará automáticamente país, ciudad, coordenadas geográficas y ASN en el nuevo widget geoespacial del Dashboard.
                </p>
              </div>

              {/* Correlated Vulnerability / CVE Section */}
              <div className="p-3 rounded bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center gap-1.5 text-cyan-400 font-bold uppercase tracking-wider text-[11px]">
                  <Bug className="w-3.5 h-3.5" />
                  <span>Correlación de Vulnerabilidad CVE / CVSS (Opcional)</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">
                      Identificador CVE / CWE
                    </label>
                    <input
                      type="text"
                      placeholder="CVE-2021-42287"
                      value={formData.cveId}
                      onChange={(e) => setFormData({ ...formData, cveId: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-rose-300 font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-500/60"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-medium mb-1">
                      Puntuación CVSS v3.1 (0.0 - 10.0)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="10"
                      placeholder="8.8"
                      value={formData.cvssScore}
                      onChange={(e) => setFormData({ ...formData, cvssScore: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-amber-300 font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-500/60"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">
                      Vector CVSS v3.1
                    </label>
                    <input
                      type="text"
                      placeholder="CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H"
                      value={formData.cvssVector}
                      onChange={(e) => setFormData({ ...formData, cvssVector: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-slate-200 font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-500/60"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-medium mb-1">
                      Técnica MITRE ATT&CK
                    </label>
                    <input
                      type="text"
                      placeholder="T1110.003 - Password Spraying"
                      value={formData.mitreTechnique}
                      onChange={(e) => setFormData({ ...formData, mitreTechnique: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-cyan-300 font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-500/60"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">
                    Acción de Remediación / Parche KB Recomendado
                  </label>
                  <input
                    type="text"
                    placeholder="Instalar parche KB5008380 y forzar PAC validation en controladores"
                    value={formData.cveRemediation}
                    onChange={(e) => setFormData({ ...formData, cveRemediation: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-emerald-300 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Descripción y Evidencia *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detalla el hallazgo, eventos relacionados y medidas de contención requeridas..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-3 text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-500/60"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 text-slate-400 hover:text-slate-200 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-slate-950 font-bold bg-cyan-400 hover:bg-cyan-300 rounded transition-colors"
                >
                  Guardar Incidencia
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
