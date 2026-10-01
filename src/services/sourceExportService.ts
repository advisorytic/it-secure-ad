import JSZip from 'jszip';

// Load all project files as raw text using Vite's eager glob imports
const srcModules = import.meta.glob<string>(
  [
    '/src/**/*',
    '/index.html',
    '/package.json',
    '/tsconfig.json',
    '/vite.config.ts',
    '/metadata.json',
    '/README.md',
    '/.env.example',
    '/.gitignore',
  ],
  {
    query: '?raw',
    import: 'default',
    eager: true,
  }
);

export interface ExportProgressCallback {
  (status: { message: string; percent: number; currentFile?: string }): void;
}

/**
 * Generates and triggers the download of the entire source code in a .zip archive.
 */
export async function downloadProjectSourceZip(
  onProgress?: ExportProgressCallback
): Promise<void> {
  const zip = new JSZip();

  onProgress?.({ message: 'Preparando estructura del proyecto...', percent: 10 });

  const entries = Object.entries(srcModules);
  const totalFiles = entries.length;

  // Add all files discovered by Vite eager glob
  let processed = 0;
  for (const [rawPath, content] of entries) {
    // Normalize path by stripping leading slash
    const cleanPath = rawPath.replace(/^\/+/, '');
    
    // Ignore node_modules, dist or temporary files if any slipped in
    if (cleanPath.startsWith('dist/') || cleanPath.startsWith('node_modules/') || cleanPath.startsWith('.git/')) {
      continue;
    }

    if (typeof content === 'string') {
      zip.file(cleanPath, content);
    }
    processed++;
    const currentPercent = Math.min(80, 10 + Math.round((processed / totalFiles) * 70));
    onProgress?.({
      message: `Empaquetando ${cleanPath}...`,
      percent: currentPercent,
      currentFile: cleanPath,
    });
  }

  // Ensure essential root files exist even if glob had filter quirks
  if (!zip.file('.env.example')) {
    zip.file(
      '.env.example',
      `# GEMINI_API_KEY: Required for Gemini AI API calls.
GEMINI_API_KEY="MY_GEMINI_API_KEY"

# APP_URL: The URL where this applet is hosted.
APP_URL="MY_APP_URL"
`
    );
  }

  if (!zip.file('.gitignore')) {
    zip.file(
      '.gitignore',
      `node_modules/
build/
dist/
coverage/
.DS_Store
*.log
.env*
!.env.example
`
    );
  }

  onProgress?.({ message: 'Comprimiendo archivo ZIP...', percent: 85 });

  // Generate the zip blob
  const zipBlob = await zip.generateAsync(
    {
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    },
    (metadata) => {
      const compressionPercent = 85 + Math.round((metadata.percent / 100) * 14);
      onProgress?.({
        message: `Comprimiendo archivos (${Math.round(metadata.percent)}%)...`,
        percent: Math.min(99, compressionPercent),
      });
    }
  );

  onProgress?.({ message: 'Iniciando descarga...', percent: 100 });

  // Format date for filename: it-car-secure-fuentes-YYYY-MM-DD.zip
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const filename = `IT-CAR-SECURE-fuentes-${dateStr}.zip`;

  // Trigger browser download via object URL
  const downloadUrl = URL.createObjectURL(zipBlob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up object URL after delay
  setTimeout(() => {
    URL.revokeObjectURL(downloadUrl);
  }, 10000);
}
