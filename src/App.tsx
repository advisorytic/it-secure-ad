import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Header } from './components/Header';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { EndpointsView } from './components/EndpointsView';
import { ThreatHuntingView } from './components/ThreatHuntingView';
import { NetworkDiscoveryView } from './components/NetworkDiscoveryView';
import { AdDnsCorrelationView } from './components/AdDnsCorrelationView';
import { IncidentsView } from './components/IncidentsView';
import { OsintView } from './components/OsintView';
import { AiUsageDetectorView } from './components/AiUsageDetectorView';
import { SecurityModulesView } from './components/SecurityModulesView';
import { SiemRmmIntegrationsView } from './components/SiemRmmIntegrationsView';
import { AdvancedProtocolMonitorView } from './components/AdvancedProtocolMonitorView';
import { RefactorReportModal } from './components/RefactorReportModal';
import { DownloadZipModal } from './components/DownloadZipModal';
import { NotificationConfigModal } from './components/NotificationConfigModal';
import { generateSecurityPdfReport } from './services/pdfReportService';
import { dispatchIncidentNotification } from './services/notificationService';
import { BellRing, X } from 'lucide-react';

import {
  Endpoint,
  Incident,
  DiscoveredHost,
  DnsAdCorrelationResult,
  IncidentStatus,
  ThreatFinding,
  WazuhAlert,
  AteraDeviceAlert,
  ZabbixTriggerAlert,
  SeverityLevel,
  TlsCertificateInfo,
  ApiEndpointHealth,
  SyntheticScriptTransaction,
} from './types/security';

import {
  INITIAL_ENDPOINTS,
  INITIAL_INCIDENTS,
  INITIAL_DISCOVERED_HOSTS,
  INITIAL_CORRELATION,
  INITIAL_LOG_SAMPLES,
  INITIAL_MODULES,
  INITIAL_WAZUH_ALERTS,
  INITIAL_ATERA_ALERTS,
  INITIAL_ZABBIX_ALERTS,
  INITIAL_TLS_CERTIFICATES,
  INITIAL_API_ENDPOINTS,
  INITIAL_SYNTHETIC_SCRIPTS,
} from './services/sampleData';

import {
  analyzeEndpointSecurity,
  assessHostCriticality,
  parseDelimitedText,
  SERVICE_NAMES,
} from './services/securityEngine';

export default function App() {
  // Main states with local storage caching for real persistence
  const [endpoints, setEndpoints] = useState<Endpoint[]>(() => {
    try {
      const stored = localStorage.getItem('itcar_endpoints');
      return stored ? JSON.parse(stored) : INITIAL_ENDPOINTS;
    } catch {
      return INITIAL_ENDPOINTS;
    }
  });

  const [incidents, setIncidents] = useState<Incident[]>(() => {
    try {
      const stored = localStorage.getItem('itcar_incidents');
      if (!stored) return INITIAL_INCIDENTS;
      const parsed: Incident[] = JSON.parse(stored);
      const merged = parsed.map((item) => {
        const initial = INITIAL_INCIDENTS.find((i) => i.id === item.id);
        if (initial) {
          return {
            ...item,
            cveId: item.cveId || initial.cveId,
            cvssScore: item.cvssScore !== undefined ? item.cvssScore : initial.cvssScore,
            cvssVector: item.cvssVector || initial.cvssVector,
            cveDescription: item.cveDescription || initial.cveDescription,
            mitreTechnique: item.mitreTechnique || initial.mitreTechnique,
            cveRemediation: item.cveRemediation || initial.cveRemediation,
            threatOriginIp: item.threatOriginIp || initial.threatOriginIp,
            threatOriginCountry: item.threatOriginCountry || initial.threatOriginCountry,
            threatOriginCountryCode: item.threatOriginCountryCode || initial.threatOriginCountryCode,
            threatOriginCity: item.threatOriginCity || initial.threatOriginCity,
            threatOriginLat: item.threatOriginLat !== undefined ? item.threatOriginLat : initial.threatOriginLat,
            threatOriginLon: item.threatOriginLon !== undefined ? item.threatOriginLon : initial.threatOriginLon,
            threatOriginAsn: item.threatOriginAsn || initial.threatOriginAsn,
            threatActor: item.threatActor || initial.threatActor,
            attackVector: item.attackVector || initial.attackVector,
          };
        }
        return item;
      });

      // Include any new initial incidents that aren't in localStorage yet
      const missingInitials = INITIAL_INCIDENTS.filter((init) => !merged.some((m) => m.id === init.id));
      return [...merged, ...missingInitials];
    } catch {
      return INITIAL_INCIDENTS;
    }
  });

  const [hosts, setHosts] = useState<DiscoveredHost[]>(() => {
    try {
      const stored = localStorage.getItem('itcar_hosts');
      return stored ? JSON.parse(stored) : INITIAL_DISCOVERED_HOSTS;
    } catch {
      return INITIAL_DISCOVERED_HOSTS;
    }
  });

  const [correlation, setCorrelation] = useState<DnsAdCorrelationResult>(INITIAL_CORRELATION);
  const [wazuhAlerts, setWazuhAlerts] = useState<WazuhAlert[]>(INITIAL_WAZUH_ALERTS);
  const [ateraAlerts, setAteraAlerts] = useState<AteraDeviceAlert[]>(INITIAL_ATERA_ALERTS);
  const [zabbixAlerts, setZabbixAlerts] = useState<ZabbixTriggerAlert[]>(INITIAL_ZABBIX_ALERTS);
  const [tlsCertificates, setTlsCertificates] = useState<TlsCertificateInfo[]>(INITIAL_TLS_CERTIFICATES);
  const [apiEndpoints, setApiEndpoints] = useState<ApiEndpointHealth[]>(INITIAL_API_ENDPOINTS);
  const [syntheticScripts, setSyntheticScripts] = useState<SyntheticScriptTransaction[]>(INITIAL_SYNTHETIC_SCRIPTS);

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isChecking, setIsChecking] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isValidatingCorrelation, setIsValidatingCorrelation] = useState(false);
  const [showRefactorModal, setShowRefactorModal] = useState(false);
  const [showDownloadZipModal, setShowDownloadZipModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationToast, setNotificationToast] = useState<{ title: string; summary: string } | null>(null);

  // Helper to dispatch alert and trigger UI toast
  const dispatchAndNotify = useCallback((incident: Incident, trigger: 'new' | 'status_change') => {
    dispatchIncidentNotification(incident, trigger).then((res) => {
      if (res.success) {
        setNotificationToast({
          title: `Alerta Despachada: ${incident.title}`,
          summary: res.notificationSummary,
        });
        setTimeout(() => setNotificationToast(null), 6000);
      }
    });
  }, []);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem('itcar_endpoints', JSON.stringify(endpoints));
    } catch {
      // Ignore quota error
    }
  }, [endpoints]);

  useEffect(() => {
    try {
      localStorage.setItem('itcar_incidents', JSON.stringify(incidents));
    } catch {
      // Ignore quota error
    }
  }, [incidents]);

  useEffect(() => {
    try {
      localStorage.setItem('itcar_hosts', JSON.stringify(hosts));
    } catch {
      // Ignore quota error
    }
  }, [hosts]);

  // Compute overall endpoint statistics
  const endpointStats = useMemo(() => {
    const total = endpoints.length;
    let up = 0;
    let degraded = 0;
    let down = 0;
    endpoints.forEach((ep) => {
      if (ep.status === 'up') up++;
      else if (ep.status === 'degraded') degraded++;
      else if (ep.status === 'down') down++;
    });
    return { total, up, degraded, down };
  }, [endpoints]);

  // Compute active critical findings across all endpoints
  const criticalFindingsCount = useMemo(() => {
    let count = 0;
    endpoints.forEach((ep) => {
      const findings = analyzeEndpointSecurity(ep);
      count += findings.filter((f) => f.severity === 'critical').length;
    });
    return count;
  }, [endpoints]);

  // Health check simulation (non-blocking)
  const handleCheckAll = useCallback(async () => {
    setIsChecking(true);
    await new Promise((resolve) => setTimeout(resolve, 800));

    setEndpoints((prev) =>
      prev.map((ep) => {
        // Realistic simulation based on URL & scheme
        let status = ep.status;
        let responseTime = ep.responseTime || 45;
        let httpStatus: number | null | undefined = ep.httpStatus || 200;
        let error = ep.error;

        if (ep.url.includes('.xyz') || ep.url.includes('sinkhole')) {
          status = 'down';
          httpStatus = null;
          responseTime = 8000;
          error = 'Conexión bloqueada por regla perimetral EDR';
        } else if (ep.url.startsWith('http://10.0.0.22')) {
          status = 'degraded';
          httpStatus = 403;
          responseTime = 140 + Math.floor(Math.random() * 60);
          error = 'HTTP 403 Forbidden (IIS restringido)';
        } else if (ep.url.includes('8080')) {
          status = 'degraded';
          httpStatus = 503;
          responseTime = 750 + Math.floor(Math.random() * 200);
          error = 'Servicio temporalmente saturado';
        } else {
          status = 'up';
          httpStatus = 200;
          responseTime = 30 + Math.floor(Math.random() * 45);
          error = null;
        }

        return {
          ...ep,
          status,
          httpStatus,
          responseTime,
          error,
          checkedAt: new Date().toISOString(),
        };
      })
    );
    setIsChecking(false);
  }, []);

  // Periodic monitoring cycle every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      handleCheckAll();
    }, 30000);
    return () => clearInterval(timer);
  }, [handleCheckAll]);

  // Add Endpoint handler
  const handleAddEndpoint = (newEpData: Omit<Endpoint, 'id' | 'createdAt'>) => {
    const newEp: Endpoint = {
      ...newEpData,
      id: `ep-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
      checkedAt: new Date().toISOString(),
      status: 'up',
      httpStatus: 200,
      responseTime: 40 + Math.floor(Math.random() * 50),
    };
    setEndpoints((prev) => [newEp, ...prev]);
  };

  // Delete Endpoint handler
  const handleDeleteEndpoint = (id: string) => {
    setEndpoints((prev) => prev.filter((ep) => ep.id !== id));
  };

  // Import CSV Endpoints handler
  const handleImportCsvEndpoints = (csvContent: string) => {
    const rows = parseDelimitedText(csvContent);
    if (rows.length === 0) throw new Error('No se detectaron filas válidas en el CSV');

    const created: Endpoint[] = rows.map((row, idx) => {
      const name = row.name || row.nombre || `Endpoint ${idx + 1}`;
      const url = row.url || row.enlace || `http://${row.ip || '10.0.0.1'}`;
      const ip = row.ip || '';
      const method = (row.method || 'GET').toUpperCase() === 'HEAD' ? 'HEAD' : 'GET';

      return {
        id: `ep-csv-${Date.now().toString(36)}-${idx}`,
        name,
        url,
        ip,
        method,
        source: 'csv',
        status: 'up',
        httpStatus: 200,
        responseTime: 45 + Math.floor(Math.random() * 40),
        checkedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
    });

    setEndpoints((prev) => [...created, ...prev]);
  };

  // Create Incident handler
  const handleCreateIncident = (incData: Omit<Incident, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newInc: Incident = {
      ...incData,
      id: `inc-${Date.now().toString(36)}`,
      createdAt: now,
      updatedAt: now,
    };
    setIncidents((prev) => [newInc, ...prev]);
    dispatchAndNotify(newInc, 'new');
  };

  // Update Incident Status handler
  const handleUpdateIncidentStatus = (id: string, status: IncidentStatus) => {
    setIncidents((prev) => {
      const updated = prev.map((inc) =>
        inc.id === id ? { ...inc, status, updatedAt: new Date().toISOString() } : inc
      );
      const target = updated.find((inc) => inc.id === id);
      if (target) {
        dispatchAndNotify(target, 'status_change');
      }
      return updated;
    });
  };

  // Promote Threat Finding from Logs directly to Incident
  const handlePromoteFindingToIncident = (finding: ThreatFinding) => {
    const now = new Date().toISOString();

    let cveId = 'CVE-2023-38831';
    let cvssScore = 7.8;
    let cvssVector = 'CVSS:3.1/AV:L/AC:L/PR:N/UI:R/S:U/C:H/I:H/A:H';
    let mitreTechnique = 'T1219 - Remote Access Software';
    let cveRemediation = 'Auditar procesos en ejecución y revocar credenciales de sesión.';

    if (finding.type === 'auth') {
      cveId = 'CVE-2021-42287';
      cvssScore = 8.8;
      cvssVector = 'CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H';
      mitreTechnique = 'T1110.003 - Brute Force: Password Spraying';
      cveRemediation = 'Aplicar parches acumulativos KB5008380 y habilitar bloqueo de cuentas tras 5 intentos.';
    } else if (finding.type === 'process') {
      cveId = 'CVE-2020-0618';
      cvssScore = 9.8;
      cvssVector = 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H';
      mitreTechnique = 'T1543.003 - Create or Modify System Process: Windows Service';
      cveRemediation = 'Aislar el host, aplicar parches acumulativos y auditar llaves de registro de Run / Services.';
    } else if (finding.type === 'powershell') {
      cveId = 'CVE-2022-41082';
      cvssScore = 8.8;
      cvssVector = 'CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H';
      mitreTechnique = 'T1059.001 - Command and Scripting Interpreter: PowerShell';
      cveRemediation = 'Habilitar Constrained Language Mode y activar ScriptBlockLogging en GPO.';
    } else if (finding.type === 'endpoint-defense') {
      cveId = 'CWE-276';
      cvssScore = 7.2;
      cvssVector = 'CVSS:3.1/AV:L/AC:L/PR:H/UI:N/S:U/C:H/I:H/A:H';
      mitreTechnique = 'T1562.001 - Impair Defenses: Disable or Modify Tools';
      cveRemediation = 'Restaurar servicios antivirus con Tamper Protection habilitado mediante directiva de Intune/GPO.';
    }

    const newInc: Incident = {
      id: `inc-promoted-${Date.now().toString(36)}`,
      title: finding.title,
      category:
        finding.type === 'auth'
          ? 'Acceso no autorizado'
          : finding.type === 'powershell'
          ? 'Ejecución de Código Malicioso'
          : finding.type === 'remote-access'
          ? 'Shadow IT / Acceso Remoto'
          : 'Seguridad de Host / EDR',
      description: `${finding.detail} (Detectado en registro de evento por el analizador heurístico IT-CAR-SECURE)`,
      assetName: finding.source || 'Host Interno',
      assetIp: finding.processId ? `PID: ${finding.processId}` : '10.0.0.22',
      severity: finding.severity,
      status: 'open',
      reportedBy: 'Motor Heurístico EDR',
      createdAt: now,
      updatedAt: now,
      cveId,
      cvssScore,
      cvssVector,
      mitreTechnique,
      cveRemediation,
    };
    setIncidents((prev) => [newInc, ...prev]);
    dispatchAndNotify(newInc, 'new');
  };

  // Promote Wazuh SIEM alert to Incident
  const handlePromoteWazuhAlert = (alert: WazuhAlert) => {
    const now = new Date().toISOString();
    const severity: SeverityLevel = alert.ruleLevel >= 12 ? 'critical' : alert.ruleLevel >= 8 ? 'high' : 'medium';
    const newInc: Incident = {
      id: `inc-wazuh-${Date.now().toString(36)}`,
      title: alert.description,
      category: alert.mitreTactic || 'Intrusión SIEM Wazuh',
      description: `${alert.fullLog} (Regla Wazuh ID ${alert.ruleId} Nivel ${alert.ruleLevel} detectada por agente ${alert.agentName})`,
      assetName: alert.agentName,
      assetIp: alert.agentIp,
      severity,
      status: 'open',
      reportedBy: 'Wazuh SIEM / XDR Agent',
      createdAt: now,
      updatedAt: now,
      cveId: alert.cveMatch,
      cvssScore: alert.cvssScore,
      mitreTechnique: alert.mitreTechnique,
      cveRemediation: 'Ejecutar Active Response para aislar host, bloquear IP de origen y parchear la vulnerabilidad señalada.',
    };
    setIncidents((prev) => [newInc, ...prev]);
    dispatchAndNotify(newInc, 'new');
  };

  // Promote Atera RMM alert to Incident
  const handlePromoteAteraAlert = (alert: AteraDeviceAlert) => {
    const now = new Date().toISOString();
    const newInc: Incident = {
      id: `inc-atera-${Date.now().toString(36)}`,
      title: `Atera RMM: ${alert.message}`,
      category: alert.alertType === 'MissingCriticalPatch' ? 'Gestión de Parches' : 'Shadow IT / RMM',
      description: `Alerta RMM generada en ${alert.deviceName} (${alert.ipAddress}, ${alert.os}). Parches pendientes: ${alert.missingKBs?.join(', ') || 'N/A'}.`,
      assetName: alert.deviceName,
      assetIp: alert.ipAddress,
      severity: alert.severity,
      status: 'open',
      reportedBy: 'Atera RMM Agent',
      createdAt: now,
      updatedAt: now,
      cveId: alert.missingKBs && alert.missingKBs.length > 0 ? 'CVE-2021-42287' : undefined,
      cvssScore: alert.missingKBs && alert.missingKBs.length > 0 ? 8.8 : undefined,
      cveRemediation: `Desplegar script de automatización Atera para forzar instalación de ${alert.missingKBs?.join(', ') || 'parches'}.`,
    };
    setIncidents((prev) => [newInc, ...prev]);
    dispatchAndNotify(newInc, 'new');
  };

  // Promote Zabbix trigger to Incident
  const handlePromoteZabbixAlert = (trigger: ZabbixTriggerAlert) => {
    const now = new Date().toISOString();
    const severity: SeverityLevel = trigger.severity === 'Disaster' || trigger.severity === 'High' ? 'critical' : 'high';
    const newInc: Incident = {
      id: `inc-zabbix-${Date.now().toString(36)}`,
      title: `Zabbix Trigger: ${trigger.triggerName}`,
      category: 'Degradación de Infraestructura',
      description: `Disparo de trigger en Zabbix para host ${trigger.hostName} (${trigger.hostIp}). Métrica '${trigger.itemKey}' alcanzó valor anómalo '${trigger.lastValue}' durante ${trigger.duration}.`,
      assetName: trigger.hostName,
      assetIp: trigger.hostIp,
      severity,
      status: 'open',
      reportedBy: 'Zabbix Server JSON-RPC',
      createdAt: now,
      updatedAt: now,
      cveRemediation: 'Revisar logs locales de servicio, liberar espacio en disco o ajustar ancho de banda en cortafuegos perimetral.',
    };
    setIncidents((prev) => [newInc, ...prev]);
    dispatchAndNotify(newInc, 'new');
  };

  // Network CIDR scan simulation
  const handleRunNetworkScan = async (cidr: string, ports: number[]) => {
    setIsScanning(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));

    // Simulate newly discovered host in the given subnet
    const octet = Math.floor(Math.random() * 80) + 150;
    const newIp = `10.0.0.${octet}`;
    const newHost: DiscoveredHost = {
      ip: newIp,
      hostname: `srv-auto-${octet}.carioca.corp`,
      name: `SRV-HOST-${octet}`,
      mac: `00:50:56:${Math.floor(Math.random() * 89 + 10)}:${Math.floor(
        Math.random() * 89 + 10
      )}:${Math.floor(Math.random() * 89 + 10)}`,
      manufacturer: 'VMware Virtual Infrastructure',
      ports: [80, 443, 3389],
      services: [
        {
          port: 80,
          service: 'HTTP',
          version: 'Microsoft-IIS/10.0',
          banner: 'Microsoft-IIS/10.0',
          evidence: 'Cabecera Server publicada',
          riskLevel: 'low',
        },
        {
          port: 443,
          service: 'HTTPS',
          version: 'TLSv1.3',
          banner: 'HTTPS Service Ready',
          evidence: 'Certificado comodín corporativo válido',
          riskLevel: 'low',
        },
        {
          port: 3389,
          service: 'RDP',
          version: 'CredSSP',
          banner: 'Terminal Server NLA',
          evidence: 'Puerto 3389 abierto para gestión',
          riskLevel: 'high',
        },
      ],
      reachable: true,
      operationalImportance: 'medium',
      importanceReasons: ['Servidor de aplicación web detectado'],
      riskLevel: 'high',
      riskReasons: ['Puerto 3389 expuesto hacia la subred local'],
      firstSeen: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      status: 'active',
      source: `Escaneo ${cidr}`,
    };

    setHosts((prev) => {
      const exists = prev.some((h) => h.ip === newHost.ip);
      return exists ? prev : [newHost, ...prev];
    });

    setIsScanning(false);
  };

  // Revalidate AD-DS / DNS Correlation
  const handleRevalidateCorrelation = async (serverIp: string) => {
    setIsValidatingCorrelation(true);
    await new Promise((resolve) => setTimeout(resolve, 900));

    const isMatch = serverIp === '10.0.0.22';
    setCorrelation({
      checkedAt: new Date().toISOString(),
      serverIp,
      dnsResponded: true,
      dnsResponseCode: 0,
      dnsError: null,
      ptrNames: isMatch ? ['dc01.carioca.com.do'] : [`host-${serverIp.replace(/\./g, '-')}.carioca.corp`],
      forwardAddresses: [serverIp],
      dnsForwardMatchesServerIp: true,
      srvRecords: isMatch
        ? [
            { type: 'SRV', value: 'dc01.carioca.com.do', priority: 0, weight: 100, port: 389 },
            { type: 'SRV', value: 'dc02.carioca.com.do', priority: 10, weight: 100, port: 389 },
          ]
        : [],
      adServerResponded: isMatch,
      adError: isMatch ? null : 'El servidor objetivo no respondió al bind LDAP en puerto 389.',
      domainName: isMatch ? 'carioca.com.do' : null,
      domainControllers: isMatch
        ? [
            { name: 'DC01-CARIOCA', hostName: 'dc01.carioca.com.do', ip: '10.0.0.22' },
            { name: 'DC02-CARIOCA', hostName: 'dc02.carioca.com.do', ip: '10.0.0.23' },
          ]
        : [],
      matchingDomainControllers: isMatch
        ? [{ name: 'DC01-CARIOCA', hostName: 'dc01.carioca.com.do', ip: '10.0.0.22' }]
        : [],
      matchingComputers: isMatch
        ? [{ name: 'DC01-CARIOCA', hostName: 'dc01.carioca.com.do', ip: '10.0.0.22' }]
        : [],
      sameServerConfirmed: isMatch,
    });
    setIsValidatingCorrelation(false);
  };

  // PDF Report generation handler
  const handleExportPdf = useCallback(() => {
    generateSecurityPdfReport({
      endpoints,
      incidents,
      generatedBy: 'Operador SOC · IT-CAR-SECURE',
    });
  }, [endpoints, incidents]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* 3-zone Top Bar Contract */}
      <Header
        onTriggerCheck={handleCheckAll}
        isChecking={isChecking}
        onOpenRefactorModal={() => setShowRefactorModal(true)}
        onExportPdf={handleExportPdf}
        onOpenDownloadZipModal={() => setShowDownloadZipModal(true)}
        onOpenNotificationModal={() => setShowNotificationModal(true)}
        endpointStats={endpointStats}
        criticalFindingsCount={criticalFindingsCount}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          incidentsCount={incidents.filter((i) => i.status !== 'resolved').length}
          threatsCount={criticalFindingsCount}
          onOpenDownloadZipModal={() => setShowDownloadZipModal(true)}
          onOpenNotificationModal={() => setShowNotificationModal(true)}
          siemAlertsCount={
            wazuhAlerts.length +
            ateraAlerts.filter((a) => a.status === 'open').length +
            zabbixAlerts.filter((z) => z.status === 'PROBLEM').length
          }
        />

        {/* Main Content Viewport */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-950/90">
          <div className="max-w-7xl mx-auto space-y-6">
            {activeTab === 'dashboard' && (
              <DashboardView
                endpoints={endpoints}
                incidents={incidents}
                onNavigateTo={(tab) => setActiveTab(tab)}
                onExportPdf={handleExportPdf}
              />
            )}

            {activeTab === 'integrations' && (
              <SiemRmmIntegrationsView
                wazuhAlerts={wazuhAlerts}
                ateraAlerts={ateraAlerts}
                zabbixAlerts={zabbixAlerts}
                onPromoteWazuhAlert={handlePromoteWazuhAlert}
                onPromoteAteraAlert={handlePromoteAteraAlert}
                onPromoteZabbixAlert={handlePromoteZabbixAlert}
              />
            )}

            {activeTab === 'protocols' && (
              <AdvancedProtocolMonitorView
                endpoints={endpoints}
                tlsCertificates={tlsCertificates}
                apiEndpoints={apiEndpoints}
                syntheticScripts={syntheticScripts}
                onTriggerCheckAll={handleCheckAll}
                isChecking={isChecking}
              />
            )}

            {activeTab === 'endpoints' && (
              <EndpointsView
                endpoints={endpoints}
                onAddEndpoint={handleAddEndpoint}
                onDeleteEndpoint={handleDeleteEndpoint}
                onImportCsv={handleImportCsvEndpoints}
                onRefreshAll={handleCheckAll}
                isChecking={isChecking}
                onExportPdf={handleExportPdf}
              />
            )}

            {activeTab === 'hunting' && (
              <ThreatHuntingView
                initialLogs={INITIAL_LOG_SAMPLES}
                onPromoteToIncident={handlePromoteFindingToIncident}
              />
            )}

            {activeTab === 'network' && (
              <NetworkDiscoveryView
                hosts={hosts}
                onAddAsEndpoint={handleAddEndpoint}
                onRunScan={handleRunNetworkScan}
                isScanning={isScanning}
              />
            )}

            {activeTab === 'ad-dns' && (
              <AdDnsCorrelationView
                correlation={correlation}
                onRevalidate={handleRevalidateCorrelation}
                isValidating={isValidatingCorrelation}
              />
            )}

            {activeTab === 'incidents' && (
              <IncidentsView
                incidents={incidents}
                onCreateIncident={handleCreateIncident}
                onUpdateStatus={handleUpdateIncidentStatus}
                onExportPdf={handleExportPdf}
                onOpenNotificationModal={() => setShowNotificationModal(true)}
              />
            )}

            {activeTab === 'osint' && <OsintView />}

            {activeTab === 'shadow-ai' && <AiUsageDetectorView />}

            {activeTab === 'modules' && <SecurityModulesView modules={INITIAL_MODULES} />}
          </div>
        </main>
      </div>

      {/* Technical Refactoring Analysis Modal */}
      <RefactorReportModal
        isOpen={showRefactorModal}
        onClose={() => setShowRefactorModal(false)}
        onOpenDownloadZipModal={() => setShowDownloadZipModal(true)}
      />

      {/* Complete Source Code .ZIP Downloader Modal */}
      <DownloadZipModal
        isOpen={showDownloadZipModal}
        onClose={() => setShowDownloadZipModal(false)}
      />

      {/* Incident Notification Configuration & Audit Modal */}
      <NotificationConfigModal
        isOpen={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
      />

      {/* Real-time Notification Dispatch Toast */}
      {notificationToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-slate-900 border border-amber-500/50 rounded-xl shadow-2xl p-4 flex items-start gap-3 animate-fade-in text-slate-200">
          <div className="w-8 h-8 rounded-full bg-amber-950/80 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
            <BellRing className="w-4 h-4 animate-bounce" />
          </div>
          <div className="flex-1 space-y-1">
            <div className="text-xs font-bold text-white flex items-center justify-between">
              <span>{notificationToast.title}</span>
              <button
                onClick={() => setNotificationToast(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[11px] text-amber-300 font-mono">
              {notificationToast.summary}
            </p>
            <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>rramirez@carioca.com.do · 849-889-3423</span>
              </span>
              <button
                onClick={() => {
                  setNotificationToast(null);
                  setShowNotificationModal(true);
                }}
                className="text-cyan-400 hover:underline font-semibold"
              >
                Ver Bitácora
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
