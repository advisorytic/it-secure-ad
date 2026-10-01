import React, { useState, useMemo } from 'react';
import {
  Shield,
  Layers,
  Radio,
  Server,
  Activity,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  PlusCircle,
  Check,
  RefreshCw,
  Search,
  Filter,
  Terminal,
  Cpu,
  Lock,
  Download,
  Flame,
  Bug,
  SlidersHorizontal,
} from 'lucide-react';

import {
  WazuhAlert,
  AteraDeviceAlert,
  ZabbixTriggerAlert,
  Incident,
  SeverityLevel,
} from '../types/security';

interface SiemRmmIntegrationsViewProps {
  wazuhAlerts: WazuhAlert[];
  ateraAlerts: AteraDeviceAlert[];
  zabbixAlerts: ZabbixTriggerAlert[];
  onPromoteWazuhAlert: (alert: WazuhAlert) => void;
  onPromoteAteraAlert: (alert: AteraDeviceAlert) => void;
  onPromoteZabbixAlert: (alert: ZabbixTriggerAlert) => void;
}

export const SiemRmmIntegrationsView: React.FC<SiemRmmIntegrationsViewProps> = ({
  wazuhAlerts,
  ateraAlerts,
  zabbixAlerts,
  onPromoteWazuhAlert,
  onPromoteAteraAlert,
  onPromoteZabbixAlert,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'all' | 'wazuh' | 'atera' | 'zabbix'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [promotedIds, setPromotedIds] = useState<Set<string>>(new Set());
  const [activeResponses, setActiveResponses] = useState<Set<string>>(new Set());
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Filtered Wazuh alerts
  const filteredWazuh = useMemo(() => {
    return wazuhAlerts.filter((a) => {
      const q = searchTerm.toLowerCase();
      return (
        a.description.toLowerCase().includes(q) ||
        a.agentName.toLowerCase().includes(q) ||
        a.agentIp.toLowerCase().includes(q) ||
        a.ruleId.includes(q) ||
        (a.cveMatch && a.cveMatch.toLowerCase().includes(q))
      );
    });
  }, [wazuhAlerts, searchTerm]);

  // Filtered Atera alerts
  const filteredAtera = useMemo(() => {
    return ateraAlerts.filter((a) => {
      const q = searchTerm.toLowerCase();
      return (
        a.message.toLowerCase().includes(q) ||
        a.deviceName.toLowerCase().includes(q) ||
        a.ipAddress.toLowerCase().includes(q) ||
        (a.missingKBs && a.missingKBs.some((kb) => kb.toLowerCase().includes(q)))
      );
    });
  }, [ateraAlerts, searchTerm]);

  // Filtered Zabbix alerts
  const filteredZabbix = useMemo(() => {
    return zabbixAlerts.filter((a) => {
      const q = searchTerm.toLowerCase();
      return (
        a.triggerName.toLowerCase().includes(q) ||
        a.hostName.toLowerCase().includes(q) ||
        a.hostIp.toLowerCase().includes(q) ||
        a.itemKey.toLowerCase().includes(q)
      );
    });
  }, [zabbixAlerts, searchTerm]);

  const handlePromoteWazuh = (alert: WazuhAlert) => {
    onPromoteWazuhAlert(alert);
    setPromotedIds((prev) => new Set(prev).add(alert.id));
  };

  const handlePromoteAtera = (alert: AteraDeviceAlert) => {
    onPromoteAteraAlert(alert);
    setPromotedIds((prev) => new Set(prev).add(alert.id));
  };

  const handlePromoteZabbix = (alert: ZabbixTriggerAlert) => {
    onPromoteZabbixAlert(alert);
    setPromotedIds((prev) => new Set(prev).add(alert.id));
  };

  const handleTriggerActiveResponse = (alertId: string) => {
    setActiveResponses((prev) => new Set(prev).add(alertId));
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Integration Ecosystem */}
      <div className="bg-slate-900 border border-slate-800 rounded p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyan-400" />
            Integración de Inteligencia: WAZUH SIEM · ATERA RMM · ZABBIX
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Correlación unificada de detección de amenazas en host (Wazuh), auditoría de parches y agentes (Atera) y métricas de infraestructura (Zabbix)
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-200">3 Conectores Activos</span>
          <span aria-hidden="true">·</span>
          <span>OpenSearch / API JSON-RPC</span>
        </div>
      </div>

      {/* Connector Health Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Wazuh Card */}
        <div className="bg-slate-900 border border-slate-800 rounded p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 flex items-center justify-center font-bold text-[10px]">
                WZ
              </div>
              <span className="text-xs font-bold text-white">Wazuh SIEM & XDR</span>
            </div>
            <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded border text-emerald-400 border-emerald-800 bg-emerald-950/60 font-semibold">
              Conectado
            </span>
          </div>
          <div className="text-[11px] text-slate-300 font-mono space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Agentes Sincronizados:</span>
              <strong className="text-white">4 / 4 Activos</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Módulos:</span>
              <span className="text-cyan-400">FIM, SCA, Rootcheck, CVE</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Alertas Nivel &gt; 9:</span>
              <strong className="text-rose-400">{wazuhAlerts.filter((a) => a.ruleLevel >= 10).length} Críticas</strong>
            </div>
          </div>
        </div>

        {/* Atera Card */}
        <div className="bg-slate-900 border border-slate-800 rounded p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-amber-950 text-amber-400 border border-amber-800 flex items-center justify-center font-bold text-[10px]">
                AT
              </div>
              <span className="text-xs font-bold text-white">Atera RMM / Telemetría</span>
            </div>
            <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded border text-emerald-400 border-emerald-800 bg-emerald-950/60 font-semibold">
              Activo
            </span>
          </div>
          <div className="text-[11px] text-slate-300 font-mono space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Flota Administrada:</span>
              <strong className="text-white">5 Equipos</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Parches Críticos Faltantes:</span>
              <strong className="text-amber-400">3 Parches KB</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Auditoría BitLocker:</span>
              <span className="text-emerald-400">100% Cifrado</span>
            </div>
          </div>
        </div>

        {/* Zabbix Card */}
        <div className="bg-slate-900 border border-slate-800 rounded p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-rose-950 text-rose-400 border border-rose-800 flex items-center justify-center font-bold text-[10px]">
                ZB
              </div>
              <span className="text-xs font-bold text-white">Zabbix Infraestructura</span>
            </div>
            <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded border text-emerald-400 border-emerald-800 bg-emerald-950/60 font-semibold">
              Sondeando
            </span>
          </div>
          <div className="text-[11px] text-slate-300 font-mono space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Triggers en Problema:</span>
              <strong className="text-rose-400">3 Alertas</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Pérdida ICMP Global:</span>
              <span className="text-emerald-400">0.00 %</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Umbral Almacenamiento C:</span>
              <strong className="text-amber-400">&lt; 10% (SQL)</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Filter Segmented Control & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-900/60 p-4 border border-slate-800 rounded">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por host, IP, regla Wazuh, parche KB o trigger Zabbix..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-500/50 font-mono"
            />
          </div>

          {/* Segmented Control */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded">
            {[
              { id: 'all', label: 'Todas las Fuentes' },
              { id: 'wazuh', label: 'Wazuh SIEM' },
              { id: 'atera', label: 'Atera RMM' },
              { id: 'zabbix', label: 'Zabbix Core' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                  activeSubTab === tab.id
                    ? 'bg-slate-800 text-cyan-300 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Feed Stream */}
      <div className="space-y-4">
        {/* WAZUH FEED */}
        {(activeSubTab === 'all' || activeSubTab === 'wazuh') && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1 font-semibold uppercase tracking-wider">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <Shield className="w-3.5 h-3.5" />
                <span>Alertas Recientes Wazuh SIEM & XDR ({filteredWazuh.length})</span>
              </span>
              <span className="text-[11px] font-mono text-slate-400 lowercase">decodificadores: windows, syscheck, sca</span>
            </div>

            {filteredWazuh.map((alert) => {
              const isPromoted = promotedIds.has(alert.id);
              const isActiveResponseDone = activeResponses.has(alert.id);
              const isLogExpanded = expandedLogId === alert.id;

              return (
                <div
                  key={alert.id}
                  className={`bg-slate-900 border rounded p-4 transition-colors space-y-2.5 ${
                    alert.ruleLevel >= 12
                      ? 'border-rose-900/60'
                      : alert.ruleLevel >= 9
                      ? 'border-amber-900/60'
                      : 'border-slate-800'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                          WAZUH RULE {alert.ruleId}
                        </span>

                        <span
                          className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                            alert.ruleLevel >= 12
                              ? 'text-rose-400 bg-rose-950/80 border-rose-800'
                              : alert.ruleLevel >= 9
                              ? 'text-amber-400 bg-amber-950/80 border-amber-800'
                              : 'text-cyan-400 bg-cyan-950/80 border-cyan-800'
                          }`}
                        >
                          Nivel {alert.ruleLevel} / 15
                        </span>

                        {alert.cveMatch && (
                          <span className="text-[10px] font-mono text-rose-300 bg-rose-950/60 border border-rose-800/60 px-1.5 py-0.2 rounded font-semibold">
                            CVE: {alert.cveMatch} (CVSS {alert.cvssScore})
                          </span>
                        )}

                        <span className="text-xs font-bold text-slate-100">
                          {alert.description}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono flex-wrap">
                        <span>Agente: <strong className="text-slate-200">{alert.agentName} (ID: {alert.agentId})</strong></span>
                        <span aria-hidden="true">·</span>
                        <span>IP: <strong className="text-cyan-400">{alert.agentIp}</strong></span>
                        <span aria-hidden="true">·</span>
                        <span>Decodificador: {alert.decoder}</span>
                        {alert.mitreId && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>MITRE: <strong className="text-amber-300">{alert.mitreId} ({alert.mitreTechnique})</strong></span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-start">
                      <button
                        onClick={() => handleTriggerActiveResponse(alert.id)}
                        disabled={isActiveResponseDone}
                        className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                          isActiveResponseDone
                            ? 'bg-slate-800 text-emerald-400 border border-emerald-800/40 cursor-default'
                            : 'bg-rose-950/70 hover:bg-rose-900/80 text-rose-200 border border-rose-800/80'
                        }`}
                        title="Ejecutar Active Response en agente Wazuh para contención"
                      >
                        {isActiveResponseDone ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>Contención Ejecutada</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-3 h-3 text-rose-400" />
                            <span>Active Response</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handlePromoteWazuh(alert)}
                        disabled={isPromoted}
                        className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                          isPromoted
                            ? 'bg-slate-800 text-emerald-400 border border-emerald-800/40 cursor-default'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                        }`}
                      >
                        {isPromoted ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>Promovido</span>
                          </>
                        ) : (
                          <>
                            <PlusCircle className="w-3 h-3 text-cyan-400" />
                            <span>Crear Incidencia</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Collapsible raw log */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setExpandedLogId(isLogExpanded ? null : alert.id)}
                      className="text-[11px] font-mono text-slate-400 hover:text-slate-200 flex items-center gap-1"
                    >
                      <Terminal className="w-3 h-3 text-cyan-400" />
                      <span>{isLogExpanded ? 'Ocultar registro crudo Wazuh' : 'Ver registro completo (Full Log & Compliance)'}</span>
                    </button>

                    {isLogExpanded && (
                      <div className="mt-2 p-3 bg-slate-950 border border-slate-800 rounded space-y-2 text-xs font-mono">
                        <div className="text-slate-300 text-[11px] leading-relaxed select-all">
                          {alert.fullLog}
                        </div>
                        {alert.compliance && (
                          <div className="flex items-center gap-2 pt-1 flex-wrap text-[10px]">
                            <span className="text-slate-400">Normativas afectadas:</span>
                            {alert.compliance.map((c) => (
                              <span key={c} className="px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-cyan-400">
                                {c}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ATERA FEED */}
        {(activeSubTab === 'all' || activeSubTab === 'atera') && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1 font-semibold uppercase tracking-wider">
              <span className="flex items-center gap-1.5 text-amber-400">
                <Cpu className="w-3.5 h-3.5" />
                <span>Alertas de Telemetría Atera RMM ({filteredAtera.length})</span>
              </span>
              <span className="text-[11px] font-mono text-slate-400 lowercase">parches kb, umbrales hardware y software</span>
            </div>

            {filteredAtera.map((alert) => {
              const isPromoted = promotedIds.has(alert.id);

              return (
                <div
                  key={alert.id}
                  className={`bg-slate-900 border rounded p-4 transition-colors space-y-2 ${
                    alert.severity === 'critical'
                      ? 'border-rose-900/60'
                      : alert.severity === 'high'
                      ? 'border-amber-900/60'
                      : 'border-slate-800'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800">
                          ATERA {alert.alertType}
                        </span>

                        <span
                          className={`text-[10px] font-mono uppercase px-1.5 py-0.2 rounded border font-semibold ${
                            alert.severity === 'critical'
                              ? 'text-rose-400 border-rose-800 bg-rose-950/60'
                              : 'text-amber-400 border-amber-800 bg-amber-950/60'
                          }`}
                        >
                          {alert.severity}
                        </span>

                        <span className="text-xs font-bold text-slate-100">
                          {alert.message}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono flex-wrap">
                        <span>Dispositivo: <strong className="text-slate-200">{alert.deviceName}</strong></span>
                        <span aria-hidden="true">·</span>
                        <span>IP: <strong className="text-cyan-400">{alert.ipAddress}</strong></span>
                        <span aria-hidden="true">·</span>
                        <span>SO: {alert.os}</span>
                        {alert.missingKBs && alert.missingKBs.length > 0 && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>Parches Faltantes: <strong className="text-rose-400">{alert.missingKBs.join(', ')}</strong></span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-start">
                      <button
                        onClick={() => handlePromoteAtera(alert)}
                        disabled={isPromoted}
                        className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                          isPromoted
                            ? 'bg-slate-800 text-emerald-400 border border-emerald-800/40 cursor-default'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                        }`}
                      >
                        {isPromoted ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>Promovido</span>
                          </>
                        ) : (
                          <>
                            <PlusCircle className="w-3 h-3 text-cyan-400" />
                            <span>Crear Incidencia</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ZABBIX FEED */}
        {(activeSubTab === 'all' || activeSubTab === 'zabbix') && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1 font-semibold uppercase tracking-wider">
              <span className="flex items-center gap-1.5 text-rose-400">
                <Activity className="w-3.5 h-3.5" />
                <span>Triggers de Infraestructura Zabbix ({filteredZabbix.length})</span>
              </span>
              <span className="text-[11px] font-mono text-slate-400 lowercase">latencia icmp, snmp y umbrales disco/cpu</span>
            </div>

            {filteredZabbix.map((trigger) => {
              const isPromoted = promotedIds.has(trigger.id);

              return (
                <div
                  key={trigger.id}
                  className={`bg-slate-900 border rounded p-4 transition-colors space-y-2 ${
                    trigger.severity === 'Disaster' || trigger.severity === 'High'
                      ? 'border-rose-900/60'
                      : 'border-slate-800'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-800">
                          ZABBIX {trigger.status}
                        </span>

                        <span
                          className={`text-[10px] font-mono uppercase px-1.5 py-0.2 rounded border font-semibold ${
                            trigger.severity === 'High' || trigger.severity === 'Disaster'
                              ? 'text-rose-400 border-rose-800 bg-rose-950/60'
                              : 'text-amber-400 border-amber-800 bg-amber-950/60'
                          }`}
                        >
                          {trigger.severity}
                        </span>

                        <span className="text-xs font-bold text-slate-100">
                          {trigger.triggerName}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono flex-wrap">
                        <span>Host: <strong className="text-slate-200">{trigger.hostName}</strong></span>
                        <span aria-hidden="true">·</span>
                        <span>IP: <strong className="text-cyan-400">{trigger.hostIp}</strong></span>
                        <span aria-hidden="true">·</span>
                        <span>Métrica ({trigger.itemKey}): <strong className="text-amber-300">{trigger.lastValue}</strong></span>
                        <span aria-hidden="true">·</span>
                        <span>Duración: {trigger.duration}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-start">
                      <button
                        onClick={() => handlePromoteZabbix(trigger)}
                        disabled={isPromoted}
                        className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                          isPromoted
                            ? 'bg-slate-800 text-emerald-400 border border-emerald-800/40 cursor-default'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                        }`}
                      >
                        {isPromoted ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>Promovido</span>
                          </>
                        ) : (
                          <>
                            <PlusCircle className="w-3 h-3 text-cyan-400" />
                            <span>Crear Incidencia</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
