import React from 'react';
import {
  BarChart3,
  Activity,
  Search,
  Network,
  Binary,
  AlertOctagon,
  Globe2,
  Cpu,
  Layers,
  Radio,
  FolderArchive,
  BellRing,
} from 'lucide-react';

export type ActiveTab =
  | 'dashboard'
  | 'integrations'
  | 'protocols'
  | 'endpoints'
  | 'hunting'
  | 'network'
  | 'ad-dns'
  | 'incidents'
  | 'osint'
  | 'shadow-ai'
  | 'modules';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  incidentsCount: number;
  threatsCount: number;
  siemAlertsCount?: number;
  onOpenDownloadZipModal?: () => void;
  onOpenNotificationModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  incidentsCount,
  threatsCount,
  siemAlertsCount = 7,
  onOpenDownloadZipModal,
  onOpenNotificationModal,
}) => {
  const menuItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'Métricas & Tendencias',
      icon: BarChart3,
      badge: null,
      desc: 'Gráficos Recharts en tiempo real',
    },
    {
      id: 'integrations' as ActiveTab,
      label: 'Wazuh · Atera · Zabbix',
      icon: Radio,
      badge: siemAlertsCount > 0 ? siemAlertsCount : null,
      badgeColor: 'text-cyan-300 bg-cyan-950/80 border-cyan-800/40',
      desc: 'SIEM XDR, RMM y telemetría de red',
    },
    {
      id: 'protocols' as ActiveTab,
      label: 'HTTP · TLS · APIs · Scripts',
      icon: Globe2,
      badge: null,
      desc: 'Inspección TLS, contratos API y scripts',
    },
    {
      id: 'endpoints' as ActiveTab,
      label: 'Salud de Endpoints',
      icon: Activity,
      badge: null,
      desc: 'Monitoreo HTTP/HTTPS y latencia',
    },
    {
      id: 'hunting' as ActiveTab,
      label: 'Caza de Amenazas & Logs',
      icon: Search,
      badge: threatsCount > 0 ? threatsCount : null,
      badgeColor: 'text-amber-400 bg-amber-950/80 border-amber-800/40',
      desc: 'Eventos Windows, fuerza bruta y persistencia',
    },
    {
      id: 'network' as ActiveTab,
      label: 'Descubrimiento de Red',
      icon: Network,
      badge: null,
      desc: 'Escaneo CIDR y banners de puertos',
    },
    {
      id: 'ad-dns' as ActiveTab,
      label: 'Correlación AD-DS / DNS',
      icon: Binary,
      badge: null,
      desc: 'Validación LDAP RootDSE y registros SRV/PTR',
    },
    {
      id: 'incidents' as ActiveTab,
      label: 'Gestión de Incidentes',
      icon: AlertOctagon,
      badge: incidentsCount > 0 ? incidentsCount : null,
      badgeColor: 'text-rose-400 bg-rose-950/80 border-rose-800/40',
      desc: 'Seguimiento, triage y exportación CSV',
    },
    {
      id: 'osint' as ActiveTab,
      label: 'Inteligencia OSINT de IP',
      icon: Globe2,
      badge: null,
      desc: 'Consultas pasivas RDAP y ASN públicas',
    },
    {
      id: 'shadow-ai' as ActiveTab,
      label: 'Auditoría de Shadow AI',
      icon: Cpu,
      badge: null,
      desc: 'Detección prudente de modelos y frameworks',
    },
    {
      id: 'modules' as ActiveTab,
      label: 'Módulos EDR / IDS / NDR',
      icon: Layers,
      badge: null,
      desc: 'F5 BIG-IP, EDR local y telemetría unificada',
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
      <div className="p-4 border-b border-slate-800">
        <div className="text-xs uppercase tracking-wider font-semibold text-slate-400 mb-1">
          Navegación Operativa
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Centro de Operaciones de Seguridad (SOC)
        </p>
      </div>

      <nav className="p-2 space-y-1 flex-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full text-left px-3 py-2.5 rounded text-xs font-medium transition-colors flex items-center justify-between group ${
                isActive
                  ? 'bg-slate-800 text-cyan-300 border-l-2 border-cyan-400 shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-300'
                  }`}
                />
                <div className="truncate">
                  <div className="truncate">{item.label}</div>
                  <div className="text-slate-400 text-[11px] truncate font-normal">
                    {item.desc}
                  </div>
                </div>
              </div>

              {item.badge !== null && (
                <span
                  className={`ml-2 px-1.5 py-0.5 rounded text-[11px] font-mono tabular-nums border shrink-0 ${
                    item.badgeColor || 'text-slate-300 bg-slate-800 border-slate-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Target Infrastructure Quick Note & Source Download */}
      <div className="p-3 m-2 bg-slate-950/70 border border-slate-800 rounded text-xs space-y-2.5">
        <div className="space-y-1">
          <div className="text-slate-400 font-medium">Objetivo Validado</div>
          <div className="font-mono text-cyan-400 text-[11px]">10.0.0.22 (DC01)</div>
          <div className="text-[11px] text-slate-400">LDAP & DNS Correlacionado</div>
        </div>

        {onOpenNotificationModal && (
          <button
            onClick={onOpenNotificationModal}
            className="w-full flex items-center justify-between py-1.5 px-2 rounded bg-amber-950/40 hover:bg-amber-950/70 border border-amber-800/40 hover:border-amber-700/60 text-amber-300 text-[11px] font-semibold transition-all group"
            title="Canales de notificación: rramirez@carioca.com.do y 849-889-3423"
          >
            <div className="flex items-center gap-1.5">
              <BellRing className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
              <span>Canales de Alerta</span>
            </div>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </button>
        )}

        {onOpenDownloadZipModal && (
          <button
            onClick={onOpenDownloadZipModal}
            className="w-full pt-2 border-t border-slate-800/80 flex items-center justify-center gap-2 py-1.5 px-2 rounded bg-emerald-950/40 hover:bg-emerald-950/70 border border-emerald-800/40 hover:border-emerald-700/60 text-emerald-300 text-[11px] font-semibold transition-all group"
            title="Descargar paquete de código fuente en formato .zip"
          >
            <FolderArchive className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span>Descargar Fuentes (.zip)</span>
          </button>
        )}
      </div>
    </aside>
  );
};
