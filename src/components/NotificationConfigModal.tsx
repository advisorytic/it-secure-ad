import React, { useState, useEffect } from 'react';
import {
  Bell,
  BellRing,
  Mail,
  Phone,
  CheckCircle2,
  AlertTriangle,
  X,
  Send,
  Save,
  RotateCcw,
  ExternalLink,
  ShieldAlert,
  Smartphone,
  History,
  FileText,
  Copy,
  Check,
  Zap,
} from 'lucide-react';
import {
  IncidentNotificationConfig,
  IncidentNotificationLog,
  SeverityLevel,
  Incident,
} from '../types/security';
import {
  getNotificationConfig,
  saveNotificationConfig,
  getNotificationLogs,
  clearNotificationLogs,
  DEFAULT_NOTIFICATION_CONFIG,
  dispatchIncidentNotification,
  buildEmailBody,
  buildEmailSubject,
  buildSmsBody,
  createMailtoUrl,
  createSmsUrl,
} from '../services/notificationService';

interface NotificationConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  sampleIncident?: Incident;
}

export const NotificationConfigModal: React.FC<NotificationConfigModalProps> = ({
  isOpen,
  onClose,
  sampleIncident,
}) => {
  const [config, setConfig] = useState<IncidentNotificationConfig>(getNotificationConfig());
  const [logs, setLogs] = useState<IncidentNotificationLog[]>([]);
  const [activeTab, setActiveTab] = useState<'settings' | 'preview' | 'logs'>('settings');
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setConfig(getNotificationConfig());
      setLogs(getNotificationLogs());
      setTestStatus(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Use provided sample incident or fallback to a realistic critical incident
  const previewIncident: Incident = sampleIncident || {
    id: 'INC-2024-001',
    title: 'Ataque de Fuerza Bruta Kerberos / AS-REP Roasting',
    category: 'Credenciales & Autenticación',
    description: 'Múltiples solicitudes Kerberos TGS malformadas hacia cuentas de servicio con cifrado débil RC4_HMAC_MD5.',
    assetName: 'DC01-PROD (Controlador de Dominio)',
    assetIp: '10.0.0.22',
    severity: 'critical',
    status: 'open',
    reportedBy: 'Heuristic Engine · EventID 4768/4769',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    cveId: 'CVE-2022-37969',
    cvssScore: 9.8,
    cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H',
    mitreTechnique: 'T1558.003 - Kerberoasting',
    cveRemediation: 'Forzar cifrado AES256 en cuentas de servicio y aplicar parche de seguridad KB5021249.',
    threatOriginIp: '185.220.101.5',
    threatOriginCountry: 'Rusia',
    threatOriginCountryCode: 'RU',
    threatOriginCity: 'Moscú',
    threatOriginAsn: 'AS208294 (Tor Exit Relay)',
    threatActor: 'APT29 / Cozy Bear',
    attackVector: 'Ataque Remoto No Autenticado a Servicio de Red',
  };

  const handleSave = () => {
    saveNotificationConfig(config);
    setSaveFeedback(true);
    setTimeout(() => setSaveFeedback(false), 2000);
  };

  const handleResetDefaults = () => {
    setConfig({ ...DEFAULT_NOTIFICATION_CONFIG });
  };

  const handleSendTestAlert = async () => {
    setIsSendingTest(true);
    setTestStatus(null);

    // Save current configuration first
    saveNotificationConfig(config);

    const testIncident: Incident = {
      ...previewIncident,
      id: `TEST-${Date.now().toString().slice(-4)}`,
      title: `[PRUEBA] Verificación de Canales de Alerta SOC`,
      description: `Prueba de conectividad y emisión de alertas de seguridad hacia ${config.emailRecipient} y ${config.phoneRecipient}.`,
    };

    const res = await dispatchIncidentNotification(testIncident, 'manual', config);
    setLogs(getNotificationLogs());
    setIsSendingTest(false);

    if (res.success) {
      setTestStatus(
        `Alerta de prueba despachada exitosamente a: ${res.notificationSummary}.`
      );
    } else {
      setTestStatus(`No se pudo enviar la alerta: ${res.skippedReason || 'Verifique los canales activos'}`);
    }
  };

  const handleClearLogs = () => {
    clearNotificationLogs();
    setLogs([]);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const emailSubject = buildEmailSubject(previewIncident);
  const emailBody = buildEmailBody(previewIncident, config.emailRecipient);
  const smsBody = buildSmsBody(previewIncident);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden text-slate-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Notificaciones de Incidentes de Seguridad
                </h2>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60 font-medium">
                  Canales Activos
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Despacho en tiempo real a Correo y Teléfono Móvil configurados
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 pt-3 bg-slate-950/30 border-b border-slate-800 flex items-center justify-between">
          <div className="flex space-x-2 text-xs">
            <button
              onClick={() => setActiveTab('settings')}
              className={`pb-2.5 px-3 font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'settings'
                  ? 'border-cyan-400 text-cyan-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Configuración de Canales</span>
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`pb-2.5 px-3 font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'preview'
                  ? 'border-cyan-400 text-cyan-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Vista Previa de Alertas</span>
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`pb-2.5 px-3 font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'logs'
                  ? 'border-cyan-400 text-cyan-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Auditoría de Envíos</span>
              {logs.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300 font-mono">
                  {logs.length}
                </span>
              )}
            </button>
          </div>

          <div className="pb-2">
            <button
              onClick={handleSendTestAlert}
              disabled={isSendingTest}
              className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold text-cyan-300 bg-cyan-950 hover:bg-cyan-900 border border-cyan-800/80 transition-colors disabled:opacity-50"
            >
              <Send className={`w-3 h-3 ${isSendingTest ? 'animate-spin' : ''}`} />
              <span>{isSendingTest ? 'Enviando...' : 'Enviar Prueba'}</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5 text-xs">
          {/* Test Status Feedback Banner */}
          {testStatus && (
            <div className="p-3.5 bg-emerald-950/60 border border-emerald-500/50 rounded-lg flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="text-emerald-300 font-medium">{testStatus}</div>
                <div className="text-[11px] text-emerald-200/70">
                  El evento ha quedado registrado en la bitácora de auditoría del SOC.
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-5">
              {/* Active Recipient Highlights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Email Box */}
                <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-cyan-400 font-medium">
                      <Mail className="w-4 h-4" />
                      <span>Canal de Correo Electrónico</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.emailEnabled}
                        onChange={(e) =>
                          setConfig((prev) => ({ ...prev, emailEnabled: e.target.checked }))
                        }
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
                    </label>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">
                      Dirección de Correo Destinatario:
                    </label>
                    <input
                      type="email"
                      value={config.emailRecipient}
                      onChange={(e) =>
                        setConfig((prev) => ({ ...prev, emailRecipient: e.target.value }))
                      }
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500"
                      placeholder="rramirez@carioca.com.do"
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Predeterminado oficial:</span>
                    <button
                      onClick={() =>
                        setConfig((prev) => ({
                          ...prev,
                          emailRecipient: 'rramirez@carioca.com.do',
                        }))
                      }
                      className="text-cyan-400 hover:underline font-mono"
                    >
                      rramirez@carioca.com.do
                    </button>
                  </div>
                </div>

                {/* SMS Box */}
                <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-400 font-medium">
                      <Phone className="w-4 h-4" />
                      <span>Canal Telefónico (SMS / Alerta Móvil)</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.smsEnabled}
                        onChange={(e) =>
                          setConfig((prev) => ({ ...prev, smsEnabled: e.target.checked }))
                        }
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">
                      Número Telefónico Destinatario:
                    </label>
                    <input
                      type="text"
                      value={config.phoneRecipient}
                      onChange={(e) =>
                        setConfig((prev) => ({ ...prev, phoneRecipient: e.target.value }))
                      }
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-200 font-mono text-xs focus:outline-none focus:border-emerald-500"
                      placeholder="849-889-3423"
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Predeterminado oficial:</span>
                    <button
                      onClick={() =>
                        setConfig((prev) => ({ ...prev, phoneRecipient: '849-889-3423' }))
                      }
                      className="text-emerald-400 hover:underline font-mono"
                    >
                      849-889-3423
                    </button>
                  </div>
                </div>
              </div>

              {/* Severity and Triggers Filter */}
              <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-lg space-y-4">
                <div className="font-semibold text-slate-200 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-cyan-400" />
                  <span>Reglas de Disparo y Criterios de Severidad</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Severidad Mínima para Despachar Alerta:
                    </label>
                    <select
                      value={config.minSeverity}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          minSeverity: e.target.value as SeverityLevel | 'all',
                        }))
                      }
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
                    >
                      <option value="all">Todas las severidades (Crítica, Alta, Media, Baja)</option>
                      <option value="medium">Media, Alta y Crítica</option>
                      <option value="high">Solo Alta y Crítica</option>
                      <option value="critical">Únicamente Crítica (CVSS 9.0+)</option>
                    </select>
                  </div>

                  <div className="space-y-2 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                      <input
                        type="checkbox"
                        checked={config.notifyOnNewIncident}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            notifyOnNewIncident: e.target.checked,
                          }))
                        }
                        className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0"
                      />
                      <span>Notificar inmediatamente al detectar o registrar un incidente</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                      <input
                        type="checkbox"
                        checked={config.notifyOnStatusChange}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            notifyOnStatusChange: e.target.checked,
                          }))
                        }
                        className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0"
                      />
                      <span>Notificar cambios de estado (Investigando / Resuelto)</span>
                    </label>
                  </div>
                </div>

                {/* Optional Webhook */}
                <div className="pt-3 border-t border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-slate-300">
                      Webhook Corporativo Opcional (Slack, Microsoft Teams, SIEM)
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.webhookEnabled}
                        onChange={(e) =>
                          setConfig((prev) => ({ ...prev, webhookEnabled: e.target.checked }))
                        }
                        className="sr-only peer"
                      />
                      <div className="w-7 h-4 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-cyan-500"></div>
                    </label>
                  </div>
                  {config.webhookEnabled && (
                    <input
                      type="url"
                      value={config.webhookUrl}
                      onChange={(e) =>
                        setConfig((prev) => ({ ...prev, webhookUrl: e.target.value }))
                      }
                      placeholder="https://hooks.slack.com/services/... o endpoint SIEM"
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500"
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'preview' && (
            <div className="space-y-4">
              <div className="p-3 bg-cyan-950/30 border border-cyan-800/40 rounded-lg text-xs text-cyan-200 flex items-center justify-between">
                <span>
                  Visualización del formato generado con el incidente activo:{' '}
                  <strong className="text-white">{previewIncident.title}</strong>
                </span>
                <div className="flex gap-2">
                  <a
                    href={createMailtoUrl(previewIncident, config.emailRecipient)}
                    className="flex items-center gap-1 px-2.5 py-1 bg-cyan-900 hover:bg-cyan-800 text-cyan-200 rounded font-medium text-[11px] transition-colors"
                    title="Abrir en cliente de correo predeterminado"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Abrir en Cliente de Correo</span>
                  </a>
                  <a
                    href={createSmsUrl(previewIncident, config.phoneRecipient)}
                    className="flex items-center gap-1 px-2.5 py-1 bg-emerald-900 hover:bg-emerald-800 text-emerald-200 rounded font-medium text-[11px] transition-colors"
                    title="Abrir en app de SMS del dispositivo"
                  >
                    <Smartphone className="w-3 h-3" />
                    <span>Abrir SMS Móvil</span>
                  </a>
                </div>
              </div>

              {/* Email Preview */}
              <div className="border border-slate-800 rounded-lg overflow-hidden">
                <div className="p-2.5 bg-slate-800/60 border-b border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-cyan-300 font-medium">
                    <Mail className="w-3.5 h-3.5" />
                    <span>Plantilla de Correo Electrónico (Destino: {config.emailRecipient})</span>
                  </div>
                  <button
                    onClick={() => handleCopy(emailBody, 'email-preview')}
                    className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white"
                  >
                    {copiedText === 'email-preview' ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400 font-medium">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copiar Cuerpo</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="p-3 bg-slate-950 font-mono text-[11px] text-slate-300 space-y-2">
                  <div className="text-cyan-400">
                    <span className="text-slate-500">Asunto: </span>
                    {emailSubject}
                  </div>
                  <pre className="text-slate-300 whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto selection:bg-cyan-900">
                    {emailBody}
                  </pre>
                </div>
              </div>

              {/* SMS Preview */}
              <div className="border border-slate-800 rounded-lg overflow-hidden">
                <div className="p-2.5 bg-slate-800/60 border-b border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-emerald-300 font-medium">
                    <Phone className="w-3.5 h-3.5" />
                    <span>Mensaje SMS / Móvil (Destino: {config.phoneRecipient})</span>
                  </div>
                  <button
                    onClick={() => handleCopy(smsBody, 'sms-preview')}
                    className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white"
                  >
                    {copiedText === 'sms-preview' ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400 font-medium">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copiar SMS</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="p-3 bg-slate-950 font-mono text-[11px] text-emerald-400">
                  {smsBody}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Registro de auditoría de alertas despachadas desde la consola
                </span>
                {logs.length > 0 && (
                  <button
                    onClick={handleClearLogs}
                    className="text-[11px] text-rose-400 hover:text-rose-300 transition-colors"
                  >
                    Limpiar historial
                  </button>
                )}
              </div>

              {logs.length === 0 ? (
                <div className="p-8 text-center bg-slate-950/40 border border-slate-800 rounded-lg text-slate-500">
                  No hay registros de notificaciones emitidas aún.
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-1.5 py-0.5 rounded font-mono text-[10px] uppercase font-bold ${
                              log.channel === 'email'
                                ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/60'
                                : log.channel === 'sms'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                                : 'bg-purple-950 text-purple-300 border border-purple-800/60'
                            }`}
                          >
                            {log.channel}
                          </span>
                          <span className="font-semibold text-white">{log.incidentTitle}</span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-400">
                          {new Date(log.timestamp).toLocaleTimeString('es-DO')}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>
                          Destinatario: <strong className="text-slate-300 font-mono">{log.recipient}</strong>
                        </span>
                        <span className="flex items-center gap-1 text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Entregado / Despachado</span>
                        </span>
                      </div>

                      <div className="p-2 bg-slate-900 rounded font-mono text-[11px] text-slate-400 truncate">
                        {log.preview}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <button
            onClick={handleResetDefaults}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors"
            title="Restaurar rramirez@carioca.com.do y 849-889-3423"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer valores predeterminados</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cerrar
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-colors shadow-sm"
            >
              {saveFeedback ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>¡Guardado!</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Guardar Configuración</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
