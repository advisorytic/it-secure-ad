import React, { useState, useMemo } from 'react';
import {
  Plus,
  Upload,
  Download,
  Search,
  CheckCircle,
  AlertCircle,
  XCircle,
  Clock,
  Trash2,
  ExternalLink,
  ShieldAlert,
  FileDown,
  Globe,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { Endpoint, ThreatFinding, DotcomMonitorProbe } from '../types/security';
import { analyzeEndpointSecurity, exportToCsv } from '../services/securityEngine';
import { INITIAL_DOTCOM_PROBES } from '../services/sampleData';

interface EndpointsViewProps {
  endpoints: Endpoint[];
  onAddEndpoint: (endpoint: Omit<Endpoint, 'id' | 'createdAt'>) => void;
  onDeleteEndpoint: (id: string) => void;
  onImportCsv: (csvContent: string) => void;
  onRefreshAll: () => void;
  isChecking: boolean;
  onExportPdf?: () => void;
}

export const EndpointsView: React.FC<EndpointsViewProps> = ({
  endpoints,
  onAddEndpoint,
  onDeleteEndpoint,
  onImportCsv,
  onRefreshAll,
  isChecking,
  onExportPdf,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'up' | 'degraded' | 'down'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedEndpointFindings, setSelectedEndpointFindings] = useState<{
    endpoint: Endpoint;
    findings: ThreatFinding[];
  } | null>(null);
  const [selectedDotcomEndpoint, setSelectedDotcomEndpoint] = useState<Endpoint | null>(null);
  const [isDotcomTesting, setIsDotcomTesting] = useState(false);
  const [dotcomProbes, setDotcomProbes] = useState<DotcomMonitorProbe[]>(INITIAL_DOTCOM_PROBES);

  const handleRunDotcomTest = async (ep: Endpoint) => {
    setIsDotcomTesting(true);
    await new Promise((resolve) => setTimeout(resolve, 850));

    const isDown = ep.status === 'down';
    const isDegraded = ep.status === 'degraded';

    setDotcomProbes((prev) =>
      prev.map((probe) => {
        let total = probe.totalTimeMs;
        let status: 'SUCCESS' | 'WARNING' | 'FAILED' = 'SUCCESS';
        let httpCode = 200;

        if (isDown) {
          status = 'FAILED';
          httpCode = 0;
          total = 5000;
        } else if (isDegraded) {
          status = 'WARNING';
          httpCode = ep.httpStatus || 403;
          total = Math.round(probe.totalTimeMs * 2.2);
        } else {
          status = 'SUCCESS';
          httpCode = 200;
          total = Math.round(probe.totalTimeMs * (0.9 + Math.random() * 0.2));
        }

        return {
          ...probe,
          status,
          httpStatus: httpCode,
          totalTimeMs: total,
          timestamp: new Date().toISOString(),
        };
      })
    );
    setIsDotcomTesting(false);
  };

  // Form states for Add Endpoint
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    ip: '',
    method: 'GET' as 'GET' | 'HEAD',
  });
  const [formError, setFormError] = useState('');

  // CSV import text
  const [csvText, setCsvText] = useState('');
  const [csvError, setCsvError] = useState('');

  // Memoized security analysis for each endpoint
  const endpointFindingsMap = useMemo(() => {
    const map = new Map<string, ThreatFinding[]>();
    endpoints.forEach((ep) => {
      map.set(ep.id, analyzeEndpointSecurity(ep));
    });
    return map;
  }, [endpoints]);

  // Filtered endpoints
  const filteredEndpoints = useMemo(() => {
    return endpoints.filter((ep) => {
      const matchesSearch =
        ep.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ep.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ep.ip.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || ep.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [endpoints, searchTerm, statusFilter]);

  const handleSubmitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('El nombre del endpoint es obligatorio');
      return;
    }
    if (!formData.url.trim()) {
      setFormError('La URL completa es obligatoria');
      return;
    }
    try {
      const parsed = new URL(formData.url);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        setFormError('La URL debe iniciar con http:// o https://');
        return;
      }
    } catch {
      setFormError('Formato de URL no válido (ejemplo: https://api.empresa.com)');
      return;
    }

    onAddEndpoint({
      name: formData.name.trim(),
      url: formData.url.trim(),
      ip: formData.ip.trim(),
      method: formData.method,
      source: 'manual',
      status: 'pending',
      httpStatus: null,
      responseTime: null,
      error: null,
      checkedAt: null,
    });

    setFormData({ name: '', url: '', ip: '', method: 'GET' });
    setFormError('');
    setShowAddModal(false);
  };

  const handleCsvImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvText.trim()) {
      setCsvError('El contenido CSV no puede estar vacío');
      return;
    }
    try {
      onImportCsv(csvText);
      setCsvText('');
      setCsvError('');
      setShowImportModal(false);
    } catch (err: unknown) {
      setCsvError(err instanceof Error ? err.message : 'Error al procesar el archivo CSV');
    }
  };

  const handleExportCsv = () => {
    const exportable = endpoints.map((ep) => ({
      ID: ep.id,
      Nombre: ep.name,
      IP: ep.ip,
      URL: ep.url,
      Metodo: ep.method,
      Estado: ep.status,
      CodigoHTTP: ep.httpStatus || '',
      Latencia_ms: ep.responseTime || '',
      Origen: ep.source,
      UltimaComprobacion: ep.checkedAt || '',
    }));
    exportToCsv(exportable, 'endpoints-monitoreados');
  };

  return (
    <div className="space-y-6">
      {/* Top action & filter bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-900/60 p-4 border border-slate-800 rounded">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Filtrar por nombre, IP o URL..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          {/* Interactive filter segmented control */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded">
            {(['all', 'up', 'degraded', 'down'] as const).map((st) => (
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
                  ? 'Todos'
                  : st === 'up'
                  ? 'Operativo'
                  : st === 'degraded'
                  ? 'Degradado'
                  : 'Caído'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded transition-colors whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nuevo Endpoint</span>
          </button>

          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors whitespace-nowrap"
            title="Importar lista desde archivo CSV"
          >
            <Upload className="w-3.5 h-3.5 text-slate-400" />
            <span>Importar CSV</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors whitespace-nowrap"
            title="Exportar inventario a CSV"
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

      {/* Main Endpoints Data Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-medium">
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4">Nombre del Activo</th>
                <th className="py-3 px-4">Dirección IP</th>
                <th className="py-3 px-4">URL del Servicio</th>
                <th className="py-3 px-4 text-center">Método</th>
                <th className="py-3 px-4 text-right">HTTP</th>
                <th className="py-3 px-4 text-right">Latencia</th>
                <th className="py-3 px-4 text-center">Alertas</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredEndpoints.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No se encontraron endpoints con los criterios seleccionados.
                  </td>
                </tr>
              ) : (
                filteredEndpoints.map((ep) => {
                  const findings = endpointFindingsMap.get(ep.id) || [];
                  const hasCritical = findings.some((f) => f.severity === 'critical');
                  const hasHigh = findings.some((f) => f.severity === 'high');

                  return (
                    <tr
                      key={ep.id}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Estado */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {ep.status === 'up' && (
                            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                          )}
                          {ep.status === 'degraded' && (
                            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                          )}
                          {ep.status === 'down' && (
                            <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                          )}
                          {ep.status === 'pending' && (
                            <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                          )}
                          <span
                            className={`capitalize font-medium ${
                              ep.status === 'up'
                                ? 'text-emerald-400'
                                : ep.status === 'degraded'
                                ? 'text-amber-400'
                                : ep.status === 'down'
                                ? 'text-rose-400'
                                : 'text-slate-400'
                            }`}
                          >
                            {ep.status === 'up'
                              ? 'Operativo'
                              : ep.status === 'degraded'
                              ? 'Degradado'
                              : ep.status === 'down'
                              ? 'Caído'
                              : 'Pendiente'}
                          </span>
                        </div>
                      </td>

                      {/* Nombre */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-100">{ep.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          ID: {ep.id} · Origen: {ep.source}
                        </div>
                      </td>

                      {/* IP */}
                      <td className="py-3 px-4 font-mono text-cyan-400 tabular-nums">
                        {ep.ip || '—'}
                      </td>

                      {/* URL */}
                      <td className="py-3 px-4 max-w-xs truncate">
                        <a
                          href={ep.url}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="text-slate-300 hover:text-cyan-400 transition-colors inline-flex items-center gap-1 group/link truncate"
                        >
                          <span className="truncate">{ep.url}</span>
                          <ExternalLink className="w-3 h-3 shrink-0 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                        </a>
                      </td>

                      {/* Método */}
                      <td className="py-3 px-4 text-center">
                        <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {ep.method}
                        </span>
                      </td>

                      {/* Código HTTP */}
                      <td className="py-3 px-4 text-right font-mono tabular-nums">
                        {ep.httpStatus ? (
                          <span
                            className={
                              ep.httpStatus >= 200 && ep.httpStatus < 300
                                ? 'text-emerald-400'
                                : ep.httpStatus >= 300 && ep.httpStatus < 400
                                ? 'text-cyan-400'
                                : 'text-rose-400'
                            }
                          >
                            {ep.httpStatus}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Latencia */}
                      <td className="py-3 px-4 text-right font-mono tabular-nums">
                        {ep.responseTime !== null && ep.responseTime !== undefined ? (
                          <span
                            className={
                              ep.responseTime < 150
                                ? 'text-emerald-400'
                                : ep.responseTime < 500
                                ? 'text-amber-400'
                                : 'text-rose-400'
                            }
                          >
                            {ep.responseTime} ms
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Hallazgos de Seguridad */}
                      <td className="py-3 px-4 text-center">
                        {findings.length > 0 ? (
                          <button
                            onClick={() =>
                              setSelectedEndpointFindings({ endpoint: ep, findings })
                            }
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border transition-colors ${
                              hasCritical
                                ? 'bg-rose-950/70 border-rose-800/80 text-rose-300 hover:bg-rose-900/60'
                                : hasHigh
                                ? 'bg-amber-950/70 border-amber-800/80 text-amber-300 hover:bg-amber-900/60'
                                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                            }`}
                          >
                            <ShieldAlert className="w-3 h-3" />
                            <span>{findings.length} aviso{findings.length > 1 ? 's' : ''}</span>
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Normal</span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="py-3 px-4 text-right whitespace-nowrap space-x-1">
                        <button
                          onClick={() => {
                            setSelectedDotcomEndpoint(ep);
                            handleRunDotcomTest(ep);
                          }}
                          className="p-1 rounded text-cyan-400 hover:text-cyan-200 hover:bg-cyan-950/60 transition-colors inline-flex items-center"
                          title="Sondeo sintético global Dotcom-Monitor (Miami, Frankfurt, São Paulo, Tokio, etc.)"
                        >
                          <Globe className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onDeleteEndpoint(ep.id)}
                          className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-950/50 transition-colors inline-flex items-center"
                          title="Eliminar endpoint"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add Endpoint */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Registrar Nuevo Endpoint
            </h3>

            {formError && (
              <div className="p-3 bg-rose-950/60 border border-rose-800/60 rounded text-rose-200 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmitAdd} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Nombre descriptivo del Activo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Servidor de Pagos Core"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-500/60"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  URL Completa del Servicio *
                </label>
                <input
                  type="text"
                  required
                  placeholder="https://10.0.0.10:8443/health"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-500/60 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Dirección IP (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="10.0.0.10"
                    value={formData.ip}
                    onChange={(e) => setFormData({ ...formData, ip: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-500/60 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Método HTTP
                  </label>
                  <select
                    value={formData.method}
                    onChange={(e) =>
                      setFormData({ ...formData, method: e.target.value as 'GET' | 'HEAD' })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500/60 font-mono"
                  >
                    <option value="GET">GET</option>
                    <option value="HEAD">HEAD</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-slate-400 hover:text-slate-200 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-slate-950 font-bold bg-cyan-400 hover:bg-cyan-300 rounded transition-colors"
                >
                  Guardar Endpoint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Import CSV */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-lg w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Importar Endpoints por Lotes (CSV)
            </h3>

            <p className="text-xs text-slate-400">
              Pega el contenido CSV con encabezados <code className="text-cyan-400">name,url,ip,method</code>.
              El sniffer soporta comas, punto y coma, pipes o tabulaciones.
            </p>

            {csvError && (
              <div className="p-3 bg-rose-950/60 border border-rose-800/60 rounded text-rose-200 text-xs">
                {csvError}
              </div>
            )}

            <form onSubmit={handleCsvImportSubmit} className="space-y-4 text-xs">
              <textarea
                rows={6}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder={`name,url,ip,method\nPortal Pagos,https://pay.carioca.com.do,10.0.0.12,GET\nDNS Cache,http://10.0.0.22:80,10.0.0.22,HEAD`}
                className="w-full bg-slate-950 border border-slate-800 rounded p-3 text-slate-200 font-mono text-[11px] focus:outline-none focus:border-cyan-500/60"
              />

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-3 py-1.5 text-slate-400 hover:text-slate-200 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-slate-950 font-bold bg-cyan-400 hover:bg-cyan-300 rounded transition-colors"
                >
                  Procesar e Importar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Findings Drawer */}
      {selectedEndpointFindings && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Evaluación de Seguridad de Endpoint
                </h3>
                <span className="text-xs text-cyan-400 font-mono">
                  {selectedEndpointFindings.endpoint.name} ({selectedEndpointFindings.endpoint.url})
                </span>
              </div>
              <button
                onClick={() => setSelectedEndpointFindings(null)}
                className="text-slate-400 hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {selectedEndpointFindings.findings.map((finding) => (
                <div
                  key={finding.id}
                  className={`p-3 rounded border text-xs space-y-1 ${
                    finding.severity === 'critical'
                      ? 'bg-rose-950/40 border-rose-800/60 text-rose-200'
                      : finding.severity === 'high'
                      ? 'bg-amber-950/40 border-amber-800/60 text-amber-200'
                      : 'bg-slate-950 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold">
                    <span>{finding.title}</span>
                    <span className="uppercase text-[10px] px-1.5 py-0.5 rounded font-mono border border-current">
                      {finding.severity}
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    {finding.detail}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => setSelectedEndpointFindings(null)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-900 bg-slate-200 hover:bg-white rounded transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Dotcom-Monitor Synthetic Global Probes */}
      {selectedDotcomEndpoint && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 flex items-center justify-center">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    Dotcom-Monitor · Sondeo Sintético Global
                    <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-1.5 py-0.2 rounded border border-cyan-800/60">
                      SLA Engine
                    </span>
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">
                    {selectedDotcomEndpoint.name} ({selectedDotcomEndpoint.url})
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedDotcomEndpoint(null)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            {/* Top action and telemetry cards */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-950 p-3 rounded border border-slate-800">
              <div className="text-xs space-y-0.5">
                <span className="text-slate-400">Motor de Sondeo Geodistribuido</span>
                <div className="text-cyan-300 font-mono font-semibold">
                  6 Ubicaciones Globales (Norteamérica, Europa, LATAM, Caribe, Asia)
                </div>
              </div>

              <button
                onClick={() => handleRunDotcomTest(selectedDotcomEndpoint)}
                disabled={isDotcomTesting}
                className="flex items-center justify-center gap-2 px-3.5 py-1.5 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded transition-colors disabled:opacity-60 whitespace-nowrap shadow-sm shadow-cyan-500/20"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isDotcomTesting ? 'animate-spin' : ''}`} />
                <span>{isDotcomTesting ? 'Sondeando Nodos Mundiales...' : 'Lanzar Sondeo Sintético Ahora'}</span>
              </button>
            </div>

            {/* Metrics summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase block">DNS Lookup Promedio</span>
                <span className="text-cyan-400 font-bold text-sm">
                  {Math.round(dotcomProbes.reduce((a, b) => a + b.dnsTimeMs, 0) / dotcomProbes.length)} ms
                </span>
              </div>
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase block">SSL Handshake</span>
                <span className="text-slate-200 font-bold text-sm">
                  {Math.round(dotcomProbes.reduce((a, b) => a + b.sslTimeMs, 0) / dotcomProbes.length)} ms
                </span>
              </div>
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase block">TTFB Promedio</span>
                <span className="text-emerald-400 font-bold text-sm">
                  {Math.round(dotcomProbes.reduce((a, b) => a + b.ttfbMs, 0) / dotcomProbes.length)} ms
                </span>
              </div>
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase block">SLA Global Uptime</span>
                <span className="text-emerald-400 font-bold text-sm">
                  {(dotcomProbes.reduce((a, b) => a + b.slaPercentage, 0) / dotcomProbes.length).toFixed(2)}%
                </span>
              </div>
            </div>

            {/* Probes table */}
            <div className="border border-slate-800 rounded overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-medium font-mono text-[11px]">
                    <th className="py-2.5 px-3">Ubicación / Nodo</th>
                    <th className="py-2.5 px-3 text-right">DNS</th>
                    <th className="py-2.5 px-3 text-right">SSL</th>
                    <th className="py-2.5 px-3 text-right">TTFB</th>
                    <th className="py-2.5 px-3 text-right">RTT Total</th>
                    <th className="py-2.5 px-3 text-center">HTTP</th>
                    <th className="py-2.5 px-3 text-right">SLA</th>
                    <th className="py-2.5 px-3 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  {dotcomProbes.map((probe) => (
                    <tr key={probe.locationId} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="mr-1.5">{probe.flag}</span>
                        <strong className="text-slate-100">{probe.locationName}</strong>
                        <span className="text-slate-400 text-[10px] block">{probe.region}</span>
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums text-slate-300">
                        {probe.dnsTimeMs} ms
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums text-slate-300">
                        {probe.sslTimeMs} ms
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums text-cyan-400">
                        {probe.ttfbMs} ms
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums font-bold text-white">
                        {probe.totalTimeMs} ms
                      </td>
                      <td className="py-2.5 px-3 text-center tabular-nums">
                        <span className={probe.httpStatus === 200 ? 'text-emerald-400' : 'text-rose-400'}>
                          {probe.httpStatus || 'ERR'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums text-emerald-400 font-semibold">
                        {probe.slaPercentage.toFixed(2)}%
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`text-[10px] uppercase px-1.5 py-0.2 rounded border font-semibold ${
                            probe.status === 'SUCCESS'
                              ? 'text-emerald-400 border-emerald-800 bg-emerald-950/60'
                              : probe.status === 'WARNING'
                              ? 'text-amber-400 border-amber-800 bg-amber-950/60'
                              : 'text-rose-400 border-rose-800 bg-rose-950/60'
                          }`}
                        >
                          {probe.status === 'SUCCESS' ? 'OK' : probe.status === 'WARNING' ? 'ALERTA' : 'FALLO'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-[11px] text-slate-400 font-mono">
              <span>Basado en el motor de sondeo sintético de dotcom-monitor.com</span>
              <button
                onClick={() => setSelectedDotcomEndpoint(null)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-900 bg-slate-200 hover:bg-white rounded transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
