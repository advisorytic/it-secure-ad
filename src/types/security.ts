export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low';
export type EndpointStatus = 'up' | 'degraded' | 'down' | 'pending';
export type IncidentStatus = 'open' | 'investigating' | 'resolved';

export interface Endpoint {
  id: string;
  name: string;
  ip: string;
  url: string;
  method: 'GET' | 'HEAD';
  source: 'manual' | 'csv' | 'discovery';
  status: EndpointStatus;
  httpStatus?: number | null;
  responseTime?: number | null;
  error?: string | null;
  checkedAt?: string | null;
  createdAt: string;
}

export interface Incident {
  id: string;
  title: string;
  category: string;
  description: string;
  assetName: string;
  assetIp: string;
  severity: SeverityLevel;
  status: IncidentStatus;
  reportedBy: string;
  createdAt: string;
  updatedAt: string;
  cveId?: string;
  cvssScore?: number;
  cvssVector?: string;
  cveDescription?: string;
  mitreTechnique?: string;
  cveRemediation?: string;
  threatOriginIp?: string;
  threatOriginCountry?: string;
  threatOriginCountryCode?: string;
  threatOriginCity?: string;
  threatOriginLat?: number;
  threatOriginLon?: number;
  threatOriginAsn?: string;
  threatActor?: string;
  attackVector?: string;
}

export interface DiscoveredService {
  port: number;
  service: string;
  version: string;
  protocolVersion?: string;
  banner: string;
  evidence: string;
  riskLevel?: SeverityLevel;
  riskReason?: string;
}

export interface DiscoveredHost {
  ip: string;
  hostname: string | null;
  name: string;
  mac: string | null;
  manufacturer: string;
  ports: number[];
  services: DiscoveredService[];
  reachable: boolean;
  operationalImportance: 'critical' | 'high' | 'medium' | 'unknown';
  importanceReasons: string[];
  riskLevel: SeverityLevel;
  riskReasons: string[];
  firstSeen?: string;
  lastSeen?: string;
  status?: 'active' | 'inactive';
  source?: string;
}

export interface LogRecord {
  TimeCreated?: string;
  Message?: string;
  ProviderName?: string;
  EventID?: string | number;
  ProcessId?: string | number;
  ProcessName?: string;
  User?: string;
  source?: string;
  line?: number;
  [key: string]: unknown;
}

export interface ThreatFinding {
  id: string;
  severity: SeverityLevel;
  title: string;
  detail: string;
  source: string;
  processId?: string;
  processName?: string;
  index?: number;
  type?: 'transport' | 'phishing' | 'shadow-it' | 'remote-access' | 'auth' | 'process' | 'powershell' | 'endpoint-defense';
}

export interface SrvRecord {
  type: string;
  value: string;
  priority?: number;
  weight?: number;
  port?: number;
}

export interface DomainControllerInfo {
  name: string;
  hostName: string;
  ip?: string;
}

export interface DnsAdCorrelationResult {
  checkedAt: string;
  serverIp: string;
  dnsResponded: boolean;
  dnsResponseCode?: number;
  dnsError?: string | null;
  ptrNames: string[];
  forwardAddresses: string[];
  dnsForwardMatchesServerIp: boolean;
  srvRecords: SrvRecord[];
  adServerResponded: boolean;
  adError?: string | null;
  domainName: string | null;
  domainControllers: DomainControllerInfo[];
  matchingDomainControllers: DomainControllerInfo[];
  matchingComputers: DomainControllerInfo[];
  sameServerConfirmed: boolean;
}

export interface IpIntelligenceData {
  ip: string;
  public: boolean;
  message?: string | null;
  osint: {
    reverseDns?: string | null;
    name?: string | null;
    handle?: string | null;
    country?: string | null;
    startAddress?: string | null;
    endAddress?: string | null;
    entities?: string[];
    rdapError?: string | null;
  };
}

export interface AiIndicatorItem {
  id: string;
  severity: SeverityLevel;
  title: string;
  detail: string;
  ip: string;
  name: string;
  indicators: string[];
}

export interface SecurityModuleStatus {
  name: string;
  key: string;
  status: 'active' | 'configured' | 'not_configured' | 'standby';
  detail: string;
  eventCount: number;
}

export interface WazuhAlert {
  id: string;
  timestamp: string;
  agentId: string;
  agentName: string;
  agentIp: string;
  ruleId: string;
  ruleLevel: number; // 1 - 15
  description: string;
  decoder: string;
  fullLog: string;
  mitreId?: string;
  mitreTactic?: string;
  mitreTechnique?: string;
  compliance?: string[];
  cveMatch?: string;
  cvssScore?: number;
  status: 'active' | 'mitigated' | 'whitelisted';
}

export interface AteraDeviceAlert {
  id: string;
  timestamp: string;
  deviceName: string;
  customerName: string;
  ipAddress: string;
  os: string;
  alertType: 'MissingCriticalPatch' | 'AgentOffline' | 'HighCpu' | 'UnapprovedSoftware' | 'BitLockerDisabled';
  severity: SeverityLevel;
  message: string;
  missingPatchesCount?: number;
  missingKBs?: string[];
  agentVersion: string;
  status: 'open' | 'resolved';
}

export interface ZabbixTriggerAlert {
  id: string;
  timestamp: string;
  hostName: string;
  hostIp: string;
  triggerName: string;
  severity: 'Disaster' | 'High' | 'Average' | 'Warning' | 'Information';
  itemKey: string;
  lastValue: string;
  status: 'PROBLEM' | 'RESOLVED';
  duration: string;
  acknowledged: boolean;
}

export interface DotcomMonitorProbe {
  locationId: string;
  locationName: string;
  region: string;
  flag: string;
  dnsTimeMs: number;
  connectTimeMs: number;
  sslTimeMs: number;
  ttfbMs: number;
  totalTimeMs: number;
  httpStatus: number;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
  slaPercentage: number;
  timestamp: string;
}

export interface TlsCertificateInfo {
  id: string;
  targetUrl: string;
  domain: string;
  ip: string;
  protocolVersion: string;
  cipherSuite: string;
  issuer: string;
  validFrom: string;
  validTo: string;
  daysRemaining: number;
  grade: 'A+' | 'A' | 'B' | 'F';
  ocspStapling: boolean;
  hstsPreloaded: boolean;
  status: 'valid' | 'expiring_soon' | 'expired' | 'weak';
}

export interface ApiEndpointHealth {
  id: string;
  name: string;
  endpointUrl: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  authType: 'Bearer JWT' | 'API-Key' | 'Basic' | 'None';
  expectedStatus: number;
  currentStatus: number;
  latencyMs: number;
  payloadSample: string;
  schemaValid: boolean;
  rateLimitRemaining: number;
  uptimePercentage: number;
  status: 'healthy' | 'degraded' | 'failing';
}

export interface SyntheticScriptTransaction {
  id: string;
  name: string;
  description: string;
  language: 'javascript' | 'powershell' | 'bash';
  code: string;
  intervalSeconds: number;
  lastRunStatus: 'PASSED' | 'FAILED' | 'WARNING';
  lastRunDurationMs: number;
  lastRunAt: string;
  steps: Array<{ name: string; status: 'PASSED' | 'FAILED'; durationMs: number }>;
  executionLogs: string[];
}

export interface IncidentNotificationConfig {
  emailEnabled: boolean;
  emailRecipient: string;
  smsEnabled: boolean;
  phoneRecipient: string;
  webhookEnabled: boolean;
  webhookUrl: string;
  minSeverity: SeverityLevel | 'all';
  notifyOnStatusChange: boolean;
  notifyOnNewIncident: boolean;
}

export interface IncidentNotificationLog {
  id: string;
  timestamp: string;
  incidentId: string;
  incidentTitle: string;
  incidentSeverity: SeverityLevel;
  channel: 'email' | 'sms' | 'webhook';
  recipient: string;
  status: 'sent' | 'simulated' | 'failed';
  subject?: string;
  preview: string;
}



