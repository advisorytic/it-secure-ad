import React from 'react';
import { Shield, RefreshCw, Code2, AlertTriangle, CheckCircle2, FileDown, FolderArchive, BellRing } from 'lucide-react';

interface HeaderProps {
  onTriggerCheck: () => void;
  isChecking: boolean;
  onOpenRefactorModal: () => void;
  onExportPdf: () => void;
  onOpenDownloadZipModal: () => void;
  onOpenNotificationModal?: () => void;
  endpointStats: { total: number; up: number; degraded: number; down: number };
  criticalFindingsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onTriggerCheck,
  isChecking,
  onOpenRefactorModal,
  onExportPdf,
  onOpenDownloadZipModal,
  onOpenNotificationModal,
  endpointStats,
  criticalFindingsCount,
}) => {
  return (
    <header className="h-16 px-6 bg-slate-900/90 backdrop-blur border-b border-slate-800 flex items-center justify-between shrink-0 z-30">
      {/* Zone 1: Brand Wordmark (Single text element) */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
          <Shield className="w-4 h-4" />
        </div>
        <div>
          <span className="text-base font-bold tracking-tight text-white flex items-center gap-2">
            IT-CAR-SECURE
            <span className="text-xs font-mono font-normal text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40">
              v2.4 Refactored
            </span>
          </span>
        </div>
      </div>

      {/* Zone 2: Real-time telemetry summary */}
      <div className="hidden lg:flex items-center gap-6 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-slate-300 font-medium">Ciclo Activo</span>
          <span aria-hidden="true" className="text-slate-700">·</span>
          <span className="font-mono text-slate-400">30s Intervalo</span>
        </div>

        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-mono tabular-nums text-slate-200">
            {endpointStats.up}/{endpointStats.total}
          </span>
          <span className="text-slate-400">Endpoints Operativos</span>
        </div>

        {criticalFindingsCount > 0 && (
          <div className="flex items-center gap-2 text-rose-400">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span className="font-mono tabular-nums font-semibold">
              {criticalFindingsCount}
            </span>
            <span>Alertas Críticas</span>
          </div>
        )}
      </div>

      {/* Zone 3: Primary Actions */}
      <div className="flex items-center gap-2.5">
        {onOpenNotificationModal && (
          <button
            onClick={onOpenNotificationModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-300 bg-amber-950/70 hover:bg-amber-900/80 border border-amber-800/80 rounded transition-colors whitespace-nowrap shadow-sm shadow-amber-950/50 group"
            title="Canales de Notificación de Incidentes: Correo (rramirez@carioca.com.do) y Teléfono (849-889-3423)"
          >
            <BellRing className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">Alertas (Email & SMS)</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </button>
        )}

        <button
          onClick={onOpenDownloadZipModal}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-emerald-300 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/80 rounded transition-colors whitespace-nowrap shadow-sm shadow-emerald-950/60 group"
          title="Descargar el código fuente completo del proyecto en formato .zip para ejecutarlo en local"
        >
          <FolderArchive className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
          <span>Descargar Fuentes (.zip)</span>
        </button>

        <button
          onClick={onExportPdf}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-cyan-300 bg-cyan-950/70 hover:bg-cyan-900/80 border border-cyan-800/80 rounded transition-colors whitespace-nowrap"
          title="Descargar resumen de incidentes y estado de endpoints en formato PDF"
        >
          <FileDown className="w-3.5 h-3.5 text-cyan-400" />
          <span>Exportar PDF</span>
        </button>

        <button
          onClick={onTriggerCheck}
          disabled={isChecking}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors disabled:opacity-60 whitespace-nowrap"
          title="Ejecutar comprobación manual de todos los endpoints"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin text-cyan-400' : ''}`} />
          <span>{isChecking ? 'Comprobando...' : 'Comprobar Red'}</span>
        </button>

        <button
          onClick={onOpenRefactorModal}
          className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded transition-colors whitespace-nowrap shadow-sm shadow-cyan-500/20"
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>Detalles de Refactorización</span>
        </button>
      </div>
    </header>
  );
};
