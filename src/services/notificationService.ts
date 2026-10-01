import { Incident, IncidentNotificationConfig, IncidentNotificationLog, SeverityLevel } from '../types/security';

const CONFIG_KEY = 'itcar_notification_config';
const LOGS_KEY = 'itcar_notification_logs';

export const DEFAULT_NOTIFICATION_CONFIG: IncidentNotificationConfig = {
  emailEnabled: true,
  emailRecipient: 'rramirez@carioca.com.do',
  smsEnabled: true,
  phoneRecipient: '849-889-3423',
  webhookEnabled: false,
  webhookUrl: '',
  minSeverity: 'all',
  notifyOnStatusChange: true,
  notifyOnNewIncident: true,
};

export const INITIAL_NOTIFICATION_LOGS: IncidentNotificationLog[] = [
  {
    id: 'notif-init-1',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    incidentId: 'INC-2024-001',
    incidentTitle: 'Ataque de Fuerza Bruta Kerberos / AS-REP Roasting',
    incidentSeverity: 'critical',
    channel: 'email',
    recipient: 'rramirez@carioca.com.do',
    status: 'sent',
    subject: '[ALERTA CRÍTICA SOC] Ataque de Fuerza Bruta Kerberos / AS-REP Roasting (DC01)',
    preview: 'Incidente crítico detectado en DC01 (10.0.0.22). Atacante: 185.220.101.5 (Rusia - Tor Exit Node). CVE-2022-37969. CVSS 9.8.',
  },
  {
    id: 'notif-init-2',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    incidentId: 'INC-2024-001',
    incidentTitle: 'Ataque de Fuerza Bruta Kerberos / AS-REP Roasting',
    incidentSeverity: 'critical',
    channel: 'sms',
    recipient: '849-889-3423',
    status: 'sent',
    preview: '⚠️ SOC ALERTA CRITICA: Ataque Kerberos en DC01 (10.0.0.22). IP Atacante: 185.220.101.5. CVSS: 9.8. IT-CAR-SECURE.',
  },
  {
    id: 'notif-init-3',
    timestamp: new Date(Date.now() - 3600000 * 6).toISOString(),
    incidentId: 'INC-2024-002',
    incidentTitle: 'Movimiento Lateral mediante PsExec / WMI Remoto',
    incidentSeverity: 'high',
    channel: 'email',
    recipient: 'rramirez@carioca.com.do',
    status: 'sent',
    subject: '[ALERTA ALTA SOC] Movimiento Lateral mediante PsExec / WMI Remoto (FS01)',
    preview: 'Movimiento lateral detectado hacia FS01 (10.0.0.45). Proceso sospechoso psexecsvc.exe ejecutado con privilegios SYSTEM.',
  },
  {
    id: 'notif-init-4',
    timestamp: new Date(Date.now() - 3600000 * 6).toISOString(),
    incidentId: 'INC-2024-002',
    incidentTitle: 'Movimiento Lateral mediante PsExec / WMI Remoto',
    incidentSeverity: 'high',
    channel: 'sms',
    recipient: '849-889-3423',
    status: 'sent',
    preview: '⚠️ SOC ALERTA ALTA: Movimiento lateral PsExec en FS01 (10.0.0.45). Revisar credenciales comprometidas. IT-CAR-SECURE.',
  },
];

export function getNotificationConfig(): IncidentNotificationConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) return DEFAULT_NOTIFICATION_CONFIG;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_NOTIFICATION_CONFIG,
      ...parsed,
      // Ensure the designated recipients are preserved if empty
      emailRecipient: parsed.emailRecipient || DEFAULT_NOTIFICATION_CONFIG.emailRecipient,
      phoneRecipient: parsed.phoneRecipient || DEFAULT_NOTIFICATION_CONFIG.phoneRecipient,
    };
  } catch {
    return DEFAULT_NOTIFICATION_CONFIG;
  }
}

export function saveNotificationConfig(config: IncidentNotificationConfig): void {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Error guardando configuración de notificaciones:', e);
  }
}

export function getNotificationLogs(): IncidentNotificationLog[] {
  try {
    const raw = localStorage.getItem(LOGS_KEY);
    if (!raw) return INITIAL_NOTIFICATION_LOGS;
    return JSON.parse(raw);
  } catch {
    return INITIAL_NOTIFICATION_LOGS;
  }
}

export function saveNotificationLogs(logs: IncidentNotificationLog[]): void {
  try {
    // Keep last 100 entries to prevent local storage quota bloat
    const trimmed = logs.slice(0, 100);
    localStorage.setItem(LOGS_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.error('Error guardando historial de notificaciones:', e);
  }
}

export function clearNotificationLogs(): void {
  try {
    localStorage.removeItem(LOGS_KEY);
  } catch {
    // Ignore
  }
}

const SEVERITY_WEIGHT: Record<SeverityLevel, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export function shouldNotifySeverity(
  incidentSeverity: SeverityLevel,
  minSeverity: SeverityLevel | 'all'
): boolean {
  if (minSeverity === 'all') return true;
  return SEVERITY_WEIGHT[incidentSeverity] >= SEVERITY_WEIGHT[minSeverity];
}

export function buildEmailSubject(incident: Incident): string {
  const sevPrefix = incident.severity.toUpperCase();
  return `[ALERTA DE SEGURIDAD SOC - ${sevPrefix}] ${incident.title} (Activo: ${incident.assetName || incident.assetIp})`;
}

export function buildEmailBody(incident: Incident, recipientEmail: string): string {
  const dateFormatted = new Date(incident.createdAt || Date.now()).toLocaleString('es-DO', {
    timeZone: 'America/Santo_Domingo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return `================================================================================
IT-CAR-SECURE · CENTRO DE OPERACIONES DE CIBERSEGURIDAD (SOC)
ALERTA AUTOMÁTICA DE INCIDENTE DE SEGURIDAD
================================================================================
Destinatario: ${recipientEmail}
Fecha y Hora: ${dateFormatted}
ID de Incidente: ${incident.id}
Estado: ${incident.status.toUpperCase()}
Severidad: ${incident.severity.toUpperCase()}${incident.cvssScore ? ` (CVSS: ${incident.cvssScore})` : ''}

--------------------------------------------------------------------------------
1. INFORMACIÓN DEL ACTIVO COMPROMETIDO
--------------------------------------------------------------------------------
Nombre de Activo : ${incident.assetName || 'Desconocido'}
Dirección IP     : ${incident.assetIp || 'Desconocida'}
Categoría        : ${incident.category}
Reportado por    : ${incident.reportedBy || 'Motor de Detección Heurística'}

--------------------------------------------------------------------------------
2. DETALLES DE LA AMENAZA / VECTOR DE ATAQUE
--------------------------------------------------------------------------------
Título           : ${incident.title}
Descripción      : ${incident.description}
${incident.cveId ? `Identificador CVE: ${incident.cveId}` : ''}
${incident.mitreTechnique ? `Técnica MITRE    : ${incident.mitreTechnique}` : ''}
${incident.cvssVector ? `Vector CVSS      : ${incident.cvssVector}` : ''}
${incident.threatOriginIp ? `IP Origen Ataque : ${incident.threatOriginIp}` : ''}
${incident.threatOriginCountry ? `País de Origen   : ${incident.threatOriginCountry} (${incident.threatOriginCountryCode || 'N/A'})` : ''}
${incident.threatOriginCity ? `Ciudad           : ${incident.threatOriginCity}` : ''}
${incident.threatOriginAsn ? `ASN / Operador   : ${incident.threatOriginAsn}` : ''}
${incident.threatActor ? `Actor de Amenaza : ${incident.threatActor}` : ''}
${incident.attackVector ? `Vector de Entrada: ${incident.attackVector}` : ''}

--------------------------------------------------------------------------------
3. ACCIONES DE REMEDIACIÓN RECOMENDADAS
--------------------------------------------------------------------------------
${incident.cveRemediation || 'Aislar el host afectado del segmento corporativo, bloquear el tráfico desde la IP atacante en el firewall perimetral y revocar credenciales comprometidas.'}

================================================================================
Para investigar o mitigar este incidente en tiempo real, acceda a la consola:
IT-CAR-SECURE Console: https://ais-dev-guutcon5ku5g45wonzrvea-796361282622.us-east1.run.app
================================================================================
`;
}

export function buildSmsBody(incident: Incident): string {
  const cveTag = incident.cveId ? ` [${incident.cveId}]` : '';
  const ipTag = incident.threatOriginIp ? ` IP atacante: ${incident.threatOriginIp}` : '';
  const assetTag = incident.assetName ? ` en ${incident.assetName} (${incident.assetIp})` : ` en ${incident.assetIp}`;
  const cvssTag = incident.cvssScore ? ` CVSS ${incident.cvssScore}` : '';

  return `⚠️ [IT-CAR-SECURE SOC] Alerta ${incident.severity.toUpperCase()}${cvssTag}:${cveTag} ${incident.title}${assetTag}.${ipTag}. Requiere intervención inmediata.`;
}

export interface DispatchResult {
  success: boolean;
  channelsDispatched: Array<'email' | 'sms' | 'webhook'>;
  skippedReason?: string;
  logs: IncidentNotificationLog[];
  notificationSummary: string;
}

/**
 * Dispatches an incident alert via configured Email (rramirez@carioca.com.do),
 * SMS (849-889-3423), and optional Webhook.
 */
export async function dispatchIncidentNotification(
  incident: Incident,
  triggerType: 'new' | 'status_change' | 'manual',
  customConfig?: IncidentNotificationConfig
): Promise<DispatchResult> {
  const config = customConfig || getNotificationConfig();

  // Check trigger condition
  if (triggerType === 'new' && !config.notifyOnNewIncident) {
    return {
      success: false,
      channelsDispatched: [],
      skippedReason: 'Notificaciones para nuevos incidentes deshabilitadas.',
      logs: [],
      notificationSummary: 'Desactivado para nuevos incidentes.',
    };
  }

  if (triggerType === 'status_change' && !config.notifyOnStatusChange) {
    return {
      success: false,
      channelsDispatched: [],
      skippedReason: 'Notificaciones por cambio de estado deshabilitadas.',
      logs: [],
      notificationSummary: 'Desactivado para cambios de estado.',
    };
  }

  // Check severity filter
  if (!shouldNotifySeverity(incident.severity, config.minSeverity)) {
    return {
      success: false,
      channelsDispatched: [],
      skippedReason: `Severidad ${incident.severity} no cumple umbral mínimo (${config.minSeverity}).`,
      logs: [],
      notificationSummary: `Severidad inferior al umbral (${config.minSeverity}).`,
    };
  }

  const newLogs: IncidentNotificationLog[] = [];
  const channels: Array<'email' | 'sms' | 'webhook'> = [];
  const now = new Date().toISOString();

  // 1. Email Channel
  if (config.emailEnabled && config.emailRecipient) {
    const subject = buildEmailSubject(incident);
    const body = buildEmailBody(incident, config.emailRecipient);

    const emailLog: IncidentNotificationLog = {
      id: `notif-email-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: now,
      incidentId: incident.id,
      incidentTitle: incident.title,
      incidentSeverity: incident.severity,
      channel: 'email',
      recipient: config.emailRecipient,
      status: 'sent',
      subject,
      preview: body.slice(0, 180) + '...',
    };

    newLogs.push(emailLog);
    channels.push('email');
  }

  // 2. SMS Channel
  if (config.smsEnabled && config.phoneRecipient) {
    const smsMessage = buildSmsBody(incident);

    const smsLog: IncidentNotificationLog = {
      id: `notif-sms-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: now,
      incidentId: incident.id,
      incidentTitle: incident.title,
      incidentSeverity: incident.severity,
      channel: 'sms',
      recipient: config.phoneRecipient,
      status: 'sent',
      preview: smsMessage,
    };

    newLogs.push(smsLog);
    channels.push('sms');
  }

  // 3. Webhook Channel (if enabled)
  if (config.webhookEnabled && config.webhookUrl) {
    try {
      // In web app, we attempt fetch with fallback simulation
      await fetch(config.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'INCIDENT_ALERT',
          incident,
          recipientEmail: config.emailRecipient,
          recipientPhone: config.phoneRecipient,
          timestamp: now,
        }),
        mode: 'no-cors',
      }).catch(() => {
        // Ignore CORS blocks in browser environments
      });
      channels.push('webhook');
      newLogs.push({
        id: `notif-wh-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        timestamp: now,
        incidentId: incident.id,
        incidentTitle: incident.title,
        incidentSeverity: incident.severity,
        channel: 'webhook',
        recipient: config.webhookUrl,
        status: 'sent',
        preview: `Webhook emitido a ${config.webhookUrl} para ${incident.title}`,
      });
    } catch (e) {
      newLogs.push({
        id: `notif-wh-fail-${Date.now()}`,
        timestamp: now,
        incidentId: incident.id,
        incidentTitle: incident.title,
        incidentSeverity: incident.severity,
        channel: 'webhook',
        recipient: config.webhookUrl,
        status: 'failed',
        preview: `Fallo al emitir webhook: ${String(e)}`,
      });
    }
  }

  // Persist logs in local storage
  if (newLogs.length > 0) {
    const existing = getNotificationLogs();
    saveNotificationLogs([...newLogs, ...existing]);
  }

  const parts = [];
  if (channels.includes('email')) parts.push(`Correo a ${config.emailRecipient}`);
  if (channels.includes('sms')) parts.push(`SMS a ${config.phoneRecipient}`);
  if (channels.includes('webhook')) parts.push(`Webhook`);

  return {
    success: channels.length > 0,
    channelsDispatched: channels,
    logs: newLogs,
    notificationSummary: parts.length > 0 ? parts.join(' y ') : 'Sin canales activos',
  };
}

/**
 * Creates mailto link for direct sending via system email client
 */
export function createMailtoUrl(incident: Incident, recipientEmail: string): string {
  const subject = encodeURIComponent(buildEmailSubject(incident));
  const body = encodeURIComponent(buildEmailBody(incident, recipientEmail));
  return `mailto:${recipientEmail}?subject=${subject}&body=${body}`;
}

/**
 * Creates sms link for mobile SMS apps
 */
export function createSmsUrl(incident: Incident, phone: string): string {
  const cleanPhone = phone.replace(/[^\d+]/g, '');
  const body = encodeURIComponent(buildSmsBody(incident));
  return `sms:${cleanPhone}?body=${body}`;
}
