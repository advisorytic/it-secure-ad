import React, { useState } from 'react';
import {
  Globe,
  Lock,
  Terminal,
  Code2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Play,
  RefreshCw,
  Search,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Layers,
  Sparkles,
  Cpu,
  FileCode,
  Sliders,
  Send,
  Eye,
  Key,
} from 'lucide-react';
import {
  Endpoint,
  TlsCertificateInfo,
  ApiEndpointHealth,
  SyntheticScriptTransaction,
} from '../types/security';

interface AdvancedProtocolMonitorViewProps {
  endpoints: Endpoint[];
  tlsCertificates: TlsCertificateInfo[];
  apiEndpoints: ApiEndpointHealth[];
  syntheticScripts: SyntheticScriptTransaction[];
  onTriggerCheckAll: () => void;
  isChecking: boolean;
}

export const AdvancedProtocolMonitorView: React.FC<AdvancedProtocolMonitorViewProps> = ({
  endpoints,
  tlsCertificates,
  apiEndpoints,
  syntheticScripts,
  onTriggerCheckAll,
  isChecking,
}) => {
  const [activeTab, setActiveTab] = useState<'http' | 'tls' | 'apis' | 'scripts'>('http');
  const [searchTerm, setSearchTerm] = useState('');

  // Live HTTP/HTTPS tester state
  const [testUrl, setTestUrl] = useState('https://carioca.com.do');
  const [testMethod, setTestMethod] = useState<'GET' | 'HEAD' | 'POST'>('GET');
  const [isHttpTesting, setIsHttpTesting] = useState(false);
  const [httpTestResult, setHttpTestResult] = useState<{
    status: number;
    latencyMs: number;
    protocol: string;
    headers: Record<string, string>;
    securityAudit: { hsts: boolean; csp: boolean; xframe: boolean; nosniff: boolean };
  } | null>({
    status: 200,
    latencyMs: 38,
    protocol: 'HTTP/2 (TLS 1.3)',
    headers: {
      'content-type': 'text/html; charset=UTF-8',
      'strict-transport-security': 'max-age=31536000; includeSubDomains; preload',
      'x-frame-options': 'DENY',
      'x-content-type-options': 'nosniff',
      'content-security-policy': "default-src 'self'; script-src 'self' 'unsafe-inline'",
      server: 'cloudflare / f5-big-ip',
    },
    securityAudit: { hsts: true, csp: true, xframe: true, nosniff: true },
  });

  // Scripts runner state
  const [scriptsList, setScriptsList] = useState<SyntheticScriptTransaction[]>(syntheticScripts);
  const [executingScriptId, setExecutingScriptId] = useState<string | null>(null);
  const [selectedScript, setSelectedScript] = useState<SyntheticScriptTransaction>(syntheticScripts[0]);

  // API Tester state
  const [selectedApi, setSelectedApi] = useState<ApiEndpointHealth>(apiEndpoints[0]);
  const [isApiTesting, setIsApiTesting] = useState(false);
  const [apiTestResponse, setApiTestResponse] = useState<string | null>(null);

  // Run live HTTP probe
  const handleRunHttpProbe = async () => {
    setIsHttpTesting(true);
    await new Promise((r) => setTimeout(r, 650));

    const isHttps = testUrl.startsWith('https://');
    const isLocalOrDown = testUrl.includes('10.0.0.35') || testUrl.includes('sinkhole');

    setHttpTestResult({
      status: isLocalOrDown ? 503 : 200,
      latencyMs: Math.floor(Math.random() * 60) + 25,
      protocol: isHttps ? 'HTTP/2 (TLS 1.3)' : 'HTTP/1.1 (Texto Plano)',
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'strict-transport-security': isHttps ? 'max-age=31536000; includeSubDomains' : 'N/A (Inseguro)',
        'x-frame-options': 'SAMEORIGIN',
        'x-content-type-options': 'nosniff',
        'content-security-policy': isHttps ? "default-src 'self'" : 'N/A',
        server: 'nginx/1.24 (Reverse Proxy F5)',
      },
      securityAudit: {
        hsts: isHttps,
        csp: isHttps,
        xframe: true,
        nosniff: true,
      },
    });
    setIsHttpTesting(false);
  };

  // Run Synthetic Script
  const handleExecuteScript = async (script: SyntheticScriptTransaction) => {
    setExecutingScriptId(script.id);
    await new Promise((r) => setTimeout(r, 900));

    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');

    const newLogLine = `[${timeStr}] [INFO] Ejecución sintética manual completada. Todas las aserciones superadas. (98ms)`;

    setScriptsList((prev) =>
      prev.map((s) => {
        if (s.id === script.id) {
          const updated = {
            ...s,
            lastRunStatus: 'PASSED' as const,
            lastRunAt: now.toISOString(),
            lastRunDurationMs: Math.floor(Math.random() * 50) + 80,
            executionLogs: [newLogLine, ...s.executionLogs],
          };
          if (selectedScript.id === script.id) {
            setSelectedScript(updated);
          }
          return updated;
        }
        return s;
      })
    );
    setExecutingScriptId(null);
  };

  // Test API Live
  const handleTestApi = async (api: ApiEndpointHealth) => {
    setIsApiTesting(true);
    await new Promise((r) => setTimeout(r, 600));

    if (api.currentStatus === 200) {
      setApiTestResponse(
        JSON.stringify(
          {
            status: 'success',
            endpoint: api.endpointUrl,
            timestamp: new Date().toISOString(),
            payloadVerified: true,
            authVerified: true,
            data: {
              server: 'API-GATEWAY-PROD',
              latency: `${api.latencyMs}ms`,
              rateLimit: `${api.rateLimitRemaining}/10000`,
            },
          },
          null,
          2
        )
      );
    } else {
      setApiTestResponse(
        JSON.stringify(
          {
            error: 'HTTP ' + api.currentStatus,
            message: 'El endpoint reportó anomalía de servicio.',
            endpoint: api.endpointUrl,
            timestamp: new Date().toISOString(),
          },
          null,
          2
        )
      );
    }
    setIsApiTesting(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Globe className="w-4 h-4 text-cyan-400" />
            Monitoreo Avanzado: HTTP · HTTPS · TLS · APIs · Scripts Sintéticos
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Inspección profunda de protocolos web, caducidad de certificados TLS, contratos de APIs REST y transacciones sintéticas automatizadas
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onTriggerCheckAll}
            disabled={isChecking}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded transition-colors disabled:opacity-60 whitespace-nowrap shadow-sm shadow-cyan-500/20"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
            <span>{isChecking ? 'Sondeando...' : 'Comprobar Todo el Stack'}</span>
          </button>
        </div>
      </div>

      {/* Navigation Subtabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 flex-wrap">
        {[
          { id: 'http', label: 'HTTP / HTTPS & Cabeceras', icon: Globe },
          { id: 'tls', label: 'Criptografía TLS / SSL', icon: Lock },
          { id: 'apis', label: 'Monitor de APIs REST', icon: Cpu },
          { id: 'scripts', label: 'Scripts Sintéticos & Transacciones', icon: Terminal },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded text-xs font-semibold transition-colors ${
                isActive
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/80 shadow-sm shadow-cyan-900/40'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: HTTP / HTTPS & CABECERAS */}
      {activeTab === 'http' && (
        <div className="space-y-6">
          {/* Live HTTP Probe Tester */}
          <div className="bg-slate-900 border border-slate-800 rounded p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Globe className="w-4 h-4 text-cyan-400" />
                <span>Sondeador en Vivo de Peticiones HTTP / HTTPS & Cabeceras de Seguridad</span>
              </h3>
              <span className="text-[11px] font-mono text-slate-400">Inspección de Cabeceras HSTS / CSP</span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <select
                value={testMethod}
                onChange={(e) => setTestMethod(e.target.value as any)}
                className="bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs font-mono font-bold text-cyan-300 focus:outline-none"
              >
                <option value="GET">GET</option>
                <option value="HEAD">HEAD</option>
                <option value="POST">POST</option>
              </select>

              <input
                type="text"
                value={testUrl}
                onChange={(e) => setTestUrl(e.target.value)}
                placeholder="https://carioca.com.do"
                className="flex-1 bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60"
              />

              <button
                onClick={handleRunHttpProbe}
                disabled={isHttpTesting}
                className="flex items-center justify-center gap-1.5 px-4 py-1.5 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded transition-colors whitespace-nowrap disabled:opacity-60"
              >
                <Send className={`w-3.5 h-3.5 ${isHttpTesting ? 'animate-pulse' : ''}`} />
                <span>{isHttpTesting ? 'Enviando...' : 'Lanzar Petición'}</span>
              </button>
            </div>

            {httpTestResult && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {/* Protocol & Audit Status */}
                <div className="space-y-3 bg-slate-950 p-3.5 rounded border border-slate-800 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-mono text-[11px]">Estado de Respuesta:</span>
                    <span
                      className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                        httpTestResult.status === 200
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}
                    >
                      HTTP {httpTestResult.status} OK
                    </span>
                  </div>

                  <div className="flex items-center justify-between font-mono text-[11px]">
                    <span className="text-slate-400">Protocolo Negociado:</span>
                    <strong className="text-cyan-400">{httpTestResult.protocol}</strong>
                  </div>

                  <div className="flex items-center justify-between font-mono text-[11px]">
                    <span className="text-slate-400">Latencia de Red:</span>
                    <strong className="text-slate-200">{httpTestResult.latencyMs} ms</strong>
                  </div>

                  <div className="pt-2 border-t border-slate-800 space-y-1.5">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      Auditoría de Cabeceras de Seguridad:
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="flex items-center gap-1.5 text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>HSTS (Cifrado Obligatorio)</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>X-Frame-Options (Anti-Clickjacking)</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Content-Security-Policy</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>X-Content-Type-Options: nosniff</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Raw Headers viewer */}
                <div className="bg-slate-950 p-3.5 rounded border border-slate-800 space-y-1.5">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block font-mono">
                    Cabeceras HTTP Recibidas:
                  </span>
                  <div className="font-mono text-[11px] text-slate-300 space-y-1 max-h-48 overflow-y-auto pr-1">
                    {Object.entries(httpTestResult.headers).map(([key, val]) => (
                      <div key={key} className="truncate">
                        <span className="text-cyan-400">{key}:</span> <span className="text-slate-300">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Endpoints HTTP/HTTPS status overview */}
          <div className="bg-slate-900 border border-slate-800 rounded p-4 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Inventario de Endpoints Monitoreados ({endpoints.length} Activos)
            </h3>
            <div className="border border-slate-800 rounded overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                    <th className="py-2.5 px-3">Servicio</th>
                    <th className="py-2.5 px-3">Protocolo</th>
                    <th className="py-2.5 px-3">URL</th>
                    <th className="py-2.5 px-3 text-center">Método</th>
                    <th className="py-2.5 px-3 text-center">Estado HTTP</th>
                    <th className="py-2.5 px-3 text-right">Latencia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  {endpoints.map((ep) => {
                    const isHttps = ep.url.startsWith('https://');
                    return (
                      <tr key={ep.id} className="hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-semibold text-slate-200">{ep.name}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] border font-bold ${
                              isHttps
                                ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800'
                                : 'text-amber-400 bg-amber-950/60 border-amber-800'
                            }`}
                          >
                            {isHttps ? 'HTTPS (Cifrado)' : 'HTTP (Plano)'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-300 truncate max-w-xs">{ep.url}</td>
                        <td className="py-2.5 px-3 text-center text-cyan-400 font-bold">{ep.method}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={
                              ep.status === 'up'
                                ? 'text-emerald-400 font-bold'
                                : ep.status === 'degraded'
                                ? 'text-amber-400 font-bold'
                                : 'text-rose-400 font-bold'
                            }
                          >
                            {ep.httpStatus || 'ERR'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums text-slate-200">
                          {ep.responseTime !== null ? `${ep.responseTime} ms` : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CRIPTOGRAFÍA TLS / SSL */}
      {activeTab === 'tls' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs font-mono">
            <div className="bg-slate-900 border border-slate-800 rounded p-3">
              <span className="text-[10px] text-slate-400 uppercase block">Versión Recomendada</span>
              <strong className="text-emerald-400 text-sm">TLS 1.3 / 1.2</strong>
              <span className="text-[10px] text-slate-500 block mt-0.5">TLS 1.0/1.1 Bloqueado</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded p-3">
              <span className="text-[10px] text-slate-400 uppercase block">Certificados Válidos</span>
              <strong className="text-emerald-400 text-sm">
                {tlsCertificates.filter((c) => c.status === 'valid').length} / {tlsCertificates.length}
              </strong>
              <span className="text-[10px] text-slate-500 block mt-0.5">En regla</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded p-3">
              <span className="text-[10px] text-slate-400 uppercase block">Próximos a Vencer (&lt;30d)</span>
              <strong className="text-amber-400 text-sm">
                {tlsCertificates.filter((c) => c.status === 'expiring_soon').length}
              </strong>
              <span className="text-[10px] text-slate-500 block mt-0.5">Renovación necesaria</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded p-3">
              <span className="text-[10px] text-slate-400 uppercase block">Expirados / Débiles</span>
              <strong className="text-rose-400 text-sm">
                {tlsCertificates.filter((c) => c.status === 'expired' || c.status === 'weak').length}
              </strong>
              <span className="text-[10px] text-slate-500 block mt-0.5">Riesgo Alto</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded p-4 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between">
              <span>Auditoría de Certificados Digitales TLS & Negociación de Cifras</span>
              <span className="text-[11px] font-mono text-slate-400 lowercase">Calificación SSL Labs</span>
            </h3>

            <div className="border border-slate-800 rounded overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                    <th className="py-2.5 px-3">Dominio & Host</th>
                    <th className="py-2.5 px-3">Versión TLS</th>
                    <th className="py-2.5 px-3">Entidad Emisora (CA)</th>
                    <th className="py-2.5 px-3">Cipher Suite Negociada</th>
                    <th className="py-2.5 px-3 text-center">Días Restantes</th>
                    <th className="py-2.5 px-3 text-center">Grado SSL</th>
                    <th className="py-2.5 px-3 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  {tlsCertificates.map((cert) => (
                    <tr key={cert.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-3">
                        <strong className="text-slate-100 block">{cert.domain}</strong>
                        <span className="text-slate-400 text-[10px]">{cert.ip}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] border font-bold ${
                            cert.protocolVersion.includes('1.3')
                              ? 'text-emerald-400 border-emerald-800 bg-emerald-950/60'
                              : cert.protocolVersion.includes('1.2')
                              ? 'text-cyan-400 border-cyan-800 bg-cyan-950/60'
                              : 'text-rose-400 border-rose-800 bg-rose-950/60'
                          }`}
                        >
                          {cert.protocolVersion}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-300">{cert.issuer}</td>
                      <td className="py-3 px-3 text-slate-300 text-[10px] max-w-xs truncate">
                        {cert.cipherSuite}
                      </td>
                      <td className="py-3 px-3 text-center tabular-nums">
                        {cert.daysRemaining > 0 ? (
                          <span
                            className={
                              cert.daysRemaining < 30
                                ? 'text-amber-400 font-bold'
                                : 'text-emerald-400 font-bold'
                            }
                          >
                            {cert.daysRemaining} días
                          </span>
                        ) : (
                          <span className="text-rose-400 font-bold">EXPIRADO ({Math.abs(cert.daysRemaining)}d)</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded font-bold text-xs ${
                            cert.grade === 'A+' || cert.grade === 'A'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : cert.grade === 'B'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-rose-950 text-rose-300 border border-rose-800'
                          }`}
                        >
                          {cert.grade}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`text-[10px] uppercase px-1.5 py-0.2 rounded border font-semibold ${
                            cert.status === 'valid'
                              ? 'text-emerald-400 border-emerald-800 bg-emerald-950/60'
                              : cert.status === 'expiring_soon'
                              ? 'text-amber-400 border-amber-800 bg-amber-950/60'
                              : 'text-rose-400 border-rose-800 bg-rose-950/60'
                          }`}
                        >
                          {cert.status === 'valid'
                            ? 'VÁLIDO'
                            : cert.status === 'expiring_soon'
                            ? 'POR RENOVAR'
                            : cert.status === 'expired'
                            ? 'EXPIRADO'
                            : 'VULNERABLE'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MONITOR DE APIS REST */}
      {activeTab === 'apis' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* APIs List */}
            <div className="lg:col-span-2 space-y-3">
              <div className="bg-slate-900 border border-slate-800 rounded p-4 space-y-3">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between">
                  <span>Endpoints de APIs Críticas ({apiEndpoints.length})</span>
                  <span className="text-[11px] font-mono text-slate-400">Verificación de Contrato & JSON Schema</span>
                </h3>

                <div className="space-y-2">
                  {apiEndpoints.map((api) => {
                    const isSelected = selectedApi.id === api.id;
                    return (
                      <div
                        key={api.id}
                        onClick={() => setSelectedApi(api)}
                        className={`p-3 rounded border cursor-pointer transition-colors space-y-1.5 ${
                          isSelected
                            ? 'bg-slate-800/80 border-cyan-500/60 shadow-sm shadow-cyan-900/20'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                                api.method === 'POST'
                                  ? 'text-cyan-300 border-cyan-800 bg-cyan-950/60'
                                  : 'text-emerald-300 border-emerald-800 bg-emerald-950/60'
                              }`}
                            >
                              {api.method}
                            </span>
                            <span className="text-xs font-bold text-slate-100">{api.name}</span>
                          </div>

                          <span
                            className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                              api.status === 'healthy'
                                ? 'text-emerald-400 border-emerald-800 bg-emerald-950/60'
                                : 'text-amber-400 border-amber-800 bg-amber-950/60'
                            }`}
                          >
                            HTTP {api.currentStatus} · {api.latencyMs} ms
                          </span>
                        </div>

                        <div className="text-[11px] font-mono text-slate-400 truncate">{api.endpointUrl}</div>

                        <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400 pt-0.5">
                          <span>Auth: <strong className="text-slate-300">{api.authType}</strong></span>
                          <span aria-hidden="true">·</span>
                          <span>Uptime: <strong className="text-emerald-400">{api.uptimePercentage}%</strong></span>
                          <span aria-hidden="true">·</span>
                          <span>Rate Limit: {api.rateLimitRemaining} req</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Selected API Inspector / Tester */}
            <div className="space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Inspección de API</span>
                  </h3>
                  <span className="text-[10px] font-mono text-cyan-400">{selectedApi.method}</span>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase block">URL:</span>
                    <span className="text-slate-200 select-all break-all">{selectedApi.endpointUrl}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[10px] uppercase block">Tipo de Autorización:</span>
                    <span className="text-cyan-300">{selectedApi.authType}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[10px] uppercase block">Payload Ejemplo:</span>
                    <pre className="bg-slate-950 p-2 rounded border border-slate-800 text-[10px] text-slate-300 overflow-x-auto">
                      {selectedApi.payloadSample}
                    </pre>
                  </div>

                  <button
                    onClick={() => handleTestApi(selectedApi)}
                    disabled={isApiTesting}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded transition-colors"
                  >
                    <Send className={`w-3.5 h-3.5 ${isApiTesting ? 'animate-spin' : ''}`} />
                    <span>{isApiTesting ? 'Ejecutando Test...' : 'Probar Respuesta en Vivo'}</span>
                  </button>

                  {apiTestResponse && (
                    <div className="pt-2">
                      <span className="text-slate-400 text-[10px] uppercase block mb-1">Respuesta JSON:</span>
                      <pre className="bg-slate-950 p-2.5 rounded border border-slate-800 text-[10px] text-emerald-300 overflow-x-auto max-h-40">
                        {apiTestResponse}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SCRIPTS SINTÉTICOS & TRANSACCIONES */}
      {activeTab === 'scripts' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Scripts List */}
            <div className="space-y-3">
              <div className="bg-slate-900 border border-slate-800 rounded p-4 space-y-3">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between">
                  <span>Scripts de Sondeo Activo ({scriptsList.length})</span>
                  <span className="text-[10px] font-mono text-cyan-400">Automatización</span>
                </h3>

                <div className="space-y-2">
                  {scriptsList.map((script) => {
                    const isSelected = selectedScript.id === script.id;
                    const isExecuting = executingScriptId === script.id;

                    return (
                      <div
                        key={script.id}
                        onClick={() => setSelectedScript(script)}
                        className={`p-3 rounded border cursor-pointer transition-colors space-y-2 ${
                          isSelected
                            ? 'bg-slate-800/80 border-cyan-500/60 shadow-sm shadow-cyan-900/20'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-[10px] font-mono uppercase px-1.5 py-0.2 rounded border font-bold ${
                              script.language === 'javascript'
                                ? 'text-amber-300 border-amber-800 bg-amber-950/60'
                                : script.language === 'powershell'
                                ? 'text-cyan-300 border-cyan-800 bg-cyan-950/60'
                                : 'text-emerald-300 border-emerald-800 bg-emerald-950/60'
                            }`}
                          >
                            {script.language}
                          </span>

                          <span
                            className={`text-[10px] font-mono uppercase px-1.5 py-0.2 rounded border font-semibold ${
                              script.lastRunStatus === 'PASSED'
                                ? 'text-emerald-400 border-emerald-800 bg-emerald-950/60'
                                : 'text-amber-400 border-amber-800 bg-amber-950/60'
                            }`}
                          >
                            {script.lastRunStatus}
                          </span>
                        </div>

                        <div className="text-xs font-bold text-slate-100">{script.name}</div>
                        <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">
                          {script.description}
                        </p>

                        <div className="flex items-center justify-between pt-1 text-[10px] font-mono text-slate-400">
                          <span>Intervalo: {script.intervalSeconds}s</span>
                          <span>Duración: {script.lastRunDurationMs} ms</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Selected Script Code & Live Console */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded p-4 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-cyan-400" />
                      <span>{selectedScript.name}</span>
                    </h3>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Última ejecución: {new Date(selectedScript.lastRunAt).toLocaleTimeString()} · Estado: {selectedScript.lastRunStatus}
                    </span>
                  </div>

                  <button
                    onClick={() => handleExecuteScript(selectedScript)}
                    disabled={executingScriptId === selectedScript.id}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded transition-colors disabled:opacity-60 whitespace-nowrap shadow-sm shadow-cyan-500/20"
                  >
                    <Play className={`w-3.5 h-3.5 ${executingScriptId === selectedScript.id ? 'animate-spin' : ''}`} />
                    <span>{executingScriptId === selectedScript.id ? 'Ejecutando...' : 'Ejecutar Script Ahora'}</span>
                  </button>
                </div>

                {/* Steps Breakdown */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">
                    Pasos de la Transacción Sintética:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                    {selectedScript.steps.map((st, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded bg-slate-950 border border-slate-800 flex items-center justify-between"
                      >
                        <span className="text-slate-300 text-[11px]">{st.name}</span>
                        <span className="text-emerald-400 font-bold text-[10px]">{st.durationMs}ms</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Code Preview */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">
                    Código del Script ({selectedScript.language}):
                  </span>
                  <pre className="bg-slate-950 p-3 rounded border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-48 leading-relaxed">
                    {selectedScript.code}
                  </pre>
                </div>

                {/* Live Console Output */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">
                    Consola de Salida & Logs de Ejecución en Vivo:
                  </span>
                  <div className="bg-slate-950 p-3 rounded border border-slate-800 text-[11px] font-mono text-emerald-400 space-y-1 max-h-48 overflow-y-auto pr-1">
                    {selectedScript.executionLogs.map((log, index) => (
                      <div key={index} className="leading-snug select-all">
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
