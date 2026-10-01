import React, { useState } from 'react';
import {
  FolderArchive,
  Download,
  CheckCircle2,
  FileCode2,
  Terminal,
  Copy,
  Check,
  X,
  Layers,
  Sparkles,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { downloadProjectSourceZip, ExportProgressCallback } from '../services/sourceExportService';

interface DownloadZipModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DownloadZipModal: React.FC<DownloadZipModalProps> = ({ isOpen, onClose }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState<{ message: string; percent: number; currentFile?: string }>({
    message: '',
    percent: 0,
  });
  const [downloadCompleted, setDownloadCompleted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedCommands, setCopiedCommands] = useState(false);

  if (!isOpen) return null;

  const handleDownload = async () => {
    setIsExporting(true);
    setErrorMessage(null);
    setDownloadCompleted(false);

    const onProgress: ExportProgressCallback = (status) => {
      setProgress(status);
    };

    try {
      await downloadProjectSourceZip(onProgress);
      setDownloadCompleted(true);
    } catch (err: unknown) {
      console.error('Error generando archivo ZIP de fuentes:', err);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Ocurrió un error inesperado al comprimir los archivos del proyecto.'
      );
    } finally {
      setIsExporting(false);
    }
  };

  const copyCommands = () => {
    const text = `unzip IT-CAR-SECURE-fuentes-*.zip
cd IT-CAR-SECURE*
npm install
npm run dev`;
    navigator.clipboard.writeText(text);
    setCopiedCommands(true);
    setTimeout(() => setCopiedCommands(false), 2500);
  };

  const filesTree = [
    {
      folder: 'src/components/',
      badge: '16 componentes',
      files: [
        'AdDnsCorrelationView.tsx',
        'AdvancedProtocolMonitorView.tsx',
        'AiUsageDetectorView.tsx',
        'DashboardView.tsx',
        'EndpointsView.tsx',
        'Header.tsx',
        'IncidentsView.tsx',
        'NetworkDiscoveryView.tsx',
        'OsintView.tsx',
        'RefactorReportModal.tsx',
        'DownloadZipModal.tsx',
        'SecurityModulesView.tsx',
        'Sidebar.tsx',
        'SiemRmmIntegrationsView.tsx',
        'ThreatHuntingView.tsx',
        'ThreatOriginMapWidget.tsx',
        'worldMapData.ts',
      ],
    },
    {
      folder: 'src/services/',
      badge: '5 servicios',
      files: [
        'securityEngine.ts',
        'threatGeoService.ts',
        'sourceExportService.ts',
        'pdfReportService.ts',
        'sampleData.ts',
      ],
    },
    {
      folder: 'src/types/ & src/',
      badge: 'Modelo de datos',
      files: ['types/security.ts', 'App.tsx', 'main.tsx', 'index.css'],
    },
    {
      folder: 'Configuración Raíz',
      badge: 'Configuración estándar',
      files: [
        'package.json',
        'tsconfig.json',
        'vite.config.ts',
        'index.html',
        'README.md',
        '.env.example',
        '.gitignore',
        'metadata.json',
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden text-slate-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <FolderArchive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Descargar Código Fuente Completo
                </h2>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-semibold">
                  .ZIP
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Paquete de código fuente completo listo para instalar y ejecutar en Node.js
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs">
          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg">
              <div className="flex items-center gap-2 text-cyan-400 font-medium mb-1">
                <FileCode2 className="w-4 h-4" />
                <span>TypeScript & React</span>
              </div>
              <div className="text-[11px] text-slate-400">
                100% tipado estricto, React 19, Tailwind CSS y Vite.
              </div>
            </div>

            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg">
              <div className="flex items-center gap-2 text-emerald-400 font-medium mb-1">
                <Layers className="w-4 h-4" />
                <span>Estructura Limpia</span>
              </div>
              <div className="text-[11px] text-slate-400">
                Componentes desacoplados, servicios SOC y motores de detección.
              </div>
            </div>

            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg">
              <div className="flex items-center gap-2 text-amber-400 font-medium mb-1">
                <Terminal className="w-4 h-4" />
                <span>Instalación Inmediata</span>
              </div>
              <div className="text-[11px] text-slate-400">
                Incluye <code className="text-slate-300 font-mono">README.md</code> y scripts de inicio rápido.
              </div>
            </div>
          </div>

          {/* Progress or Download Action Banner */}
          {isExporting ? (
            <div className="p-4 bg-cyan-950/40 border border-cyan-500/30 rounded-lg space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-cyan-300 font-medium flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  {progress.message || 'Generando archivo .zip...'}
                </span>
                <span className="font-mono text-cyan-200 font-bold">{progress.percent}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full rounded-full transition-all duration-200"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
              {progress.currentFile && (
                <div className="font-mono text-[11px] text-slate-400 truncate">
                  Archivo actual: <span className="text-slate-300">{progress.currentFile}</span>
                </div>
              )}
            </div>
          ) : downloadCompleted ? (
            <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-lg flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="text-emerald-300 font-semibold">
                  ¡Descarga iniciada exitosamente!
                </div>
                <div className="text-[11px] text-emerald-200/80 leading-relaxed">
                  Tu navegador ha comenzado a descargar el archivo{' '}
                  <span className="font-mono font-bold text-white">IT-CAR-SECURE-fuentes-*.zip</span>.
                  Si tu navegador solicita confirmación para guardar descargas, selecciona &quot;Permitir&quot;.
                </div>
              </div>
            </div>
          ) : errorMessage ? (
            <div className="p-4 bg-rose-950/40 border border-rose-500/40 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="text-rose-300 font-semibold">Error al generar la descarga</div>
                <div className="text-[11px] text-rose-200/80">{errorMessage}</div>
              </div>
            </div>
          ) : null}

          {/* Included Files Inventory */}
          <div className="border border-slate-800 rounded-lg bg-slate-950/50 overflow-hidden">
            <div className="px-3.5 py-2 bg-slate-800/40 border-b border-slate-800 text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-cyan-400" />
                Contenido que se incluirá en el paquete .ZIP
              </span>
              <span className="text-[11px] font-mono text-slate-400">Total: 30+ archivos</span>
            </div>
            <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto">
              {filesTree.map((sec, idx) => (
                <div key={idx} className="bg-slate-900/60 p-2.5 rounded border border-slate-800/60">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-cyan-300 font-medium text-[11px]">
                      {sec.folder}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 bg-slate-800 text-slate-400 rounded">
                      {sec.badge}
                    </span>
                  </div>
                  <ul className="space-y-0.5">
                    {sec.files.slice(0, 5).map((f, fIdx) => (
                      <li key={fIdx} className="font-mono text-[10px] text-slate-400 truncate flex items-center gap-1.5">
                        <span className="text-slate-600">▪</span> {f}
                      </li>
                    ))}
                    {sec.files.length > 5 && (
                      <li className="font-mono text-[10px] text-cyan-400/80">
                        + {sec.files.length - 5} archivos adicionales...
                      </li>
                    )}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Execution snippet */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                Cómo ejecutar el proyecto localmente tras descomprimir:
              </span>
              <button
                onClick={copyCommands}
                className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors"
                title="Copiar comandos al portapapeles"
              >
                {copiedCommands ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400 font-medium">Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copiar comandos</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg font-mono text-[11px] text-emerald-400 overflow-x-auto selection:bg-emerald-900">
{`# 1. Instalar las dependencias de Node.js
npm install

# 2. Iniciar el entorno de desarrollo local
npm run dev

# 3. Compilar para producción (opcional)
npm run build`}
            </pre>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Archivo sin dependencias externas pesadas (node_modules no se incluye)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cerrar
            </button>
            <button
              onClick={handleDownload}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-all disabled:opacity-60 shadow-md shadow-cyan-500/20 active:scale-95"
            >
              <Download className={`w-4 h-4 ${isExporting ? 'animate-bounce' : ''}`} />
              <span>
                {isExporting
                  ? 'Generando ZIP...'
                  : downloadCompleted
                  ? 'Volver a Descargar .ZIP'
                  : 'Descargar Fuentes (.zip)'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
