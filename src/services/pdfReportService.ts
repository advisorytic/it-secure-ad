import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Endpoint, Incident } from '../types/security';

export interface GenerateReportOptions {
  endpoints: Endpoint[];
  incidents: Incident[];
  generatedBy?: string;
}

export function generateSecurityPdfReport({
  endpoints,
  incidents,
  generatedBy = 'Operador SOC IT-CAR-SECURE',
}: GenerateReportOptions): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const now = new Date();
  const dateFormatted = now.toLocaleDateString('es-DO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const timeFormatted = now.toLocaleTimeString('es-DO', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  // KPI Metrics Calculation
  const totalEndpoints = endpoints.length;
  const upEndpoints = endpoints.filter((e) => e.status === 'up').length;
  const degradedEndpoints = endpoints.filter((e) => e.status === 'degraded').length;
  const downEndpoints = endpoints.filter((e) => e.status === 'down').length;
  const availability = totalEndpoints > 0
    ? (((upEndpoints + degradedEndpoints * 0.5) / totalEndpoints) * 100).toFixed(1)
    : '100';

  const validLatencies = endpoints.filter((e) => typeof e.responseTime === 'number' && e.responseTime < 7000);
  const avgLatency = validLatencies.length > 0
    ? Math.round(validLatencies.reduce((acc, c) => acc + (c.responseTime || 0), 0) / validLatencies.length)
    : 0;

  const totalIncidents = incidents.length;
  const criticalCount = incidents.filter((i) => i.severity === 'critical').length;
  const highCount = incidents.filter((i) => i.severity === 'high').length;
  const openCount = incidents.filter((i) => i.status !== 'resolved').length;
  const resolvedCount = incidents.filter((i) => i.status === 'resolved').length;

  // --- Header Dark Bar ---
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 32, 'F');

  // Accent Stripe
  doc.setFillColor(6, 182, 212); // cyan-500
  doc.rect(0, 32, 210, 1.5, 'F');

  // Brand and Title in Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('IT-CAR-SECURE', 14, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(6, 182, 212);
  doc.text('CENTRO DE OPERACIONES DE SEGURIDAD (SOC)', 14, 20);

  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(`Informe de Estado de Endpoints y Resumen de Incidentes`, 14, 26);

  // Metadata in Header right
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text(`Fecha: ${dateFormatted} ${timeFormatted}`, 196, 14, { align: 'right' });
  doc.text(`Generado por: ${generatedBy}`, 196, 20, { align: 'right' });
  doc.text(`Clasificación: CONFIDENCIAL / USO INTERNO`, 196, 26, { align: 'right' });

  let currentY = 40;

  // --- Executive Summary Box ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('1. Resumen Ejecutivo de Métricas Clave', 14, currentY);
  currentY += 4;

  const cardWidth = 44;
  const cardHeight = 16;
  const cardGap = 4;
  let startX = 14;

  const kpis = [
    { label: 'Disponibilidad Global', value: `${availability}%`, color: [16, 185, 129] }, // emerald
    { label: 'Latencia Promedio', value: `${avgLatency} ms`, color: [6, 182, 212] },     // cyan
    { label: 'Incidentes Activos', value: `${openCount} / ${totalIncidents}`, color: [245, 158, 11] }, // amber
    { label: 'Alertas Críticas P1', value: `${criticalCount}`, color: [244, 63, 94] },  // rose
  ];

  kpis.forEach((kpi, idx) => {
    const x = startX + idx * (cardWidth + cardGap);
    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.roundedRect(x, currentY, cardWidth, cardHeight, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label, x + 3, currentY + 5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.text(kpi.value, x + 3, currentY + 12);
  });

  currentY += cardHeight + 8;

  // --- Section 2: Endpoints Table ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`2. Estado Actual de Endpoints Monitoreados (${totalEndpoints} Activos)`, 14, currentY);
  currentY += 2;

  const endpointRows = endpoints.map((ep) => [
    ep.name,
    ep.ip || '—',
    ep.url.length > 38 ? `${ep.url.slice(0, 36)}…` : ep.url,
    ep.method,
    ep.httpStatus ? String(ep.httpStatus) : '—',
    ep.responseTime !== null && ep.responseTime !== undefined ? `${ep.responseTime} ms` : '—',
    ep.status === 'up'
      ? 'Operativo'
      : ep.status === 'degraded'
      ? 'Degradado'
      : ep.status === 'down'
      ? 'Caído'
      : 'Pendiente',
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['Nombre Activo', 'IP', 'URL del Servicio', 'Método', 'HTTP', 'Latencia', 'Estado']],
    body: endpointRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
      cellPadding: 2,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 42 },
      1: { cellWidth: 24, font: 'courier' },
      2: { cellWidth: 50 },
      3: { cellWidth: 14, halign: 'center', font: 'courier' },
      4: { cellWidth: 14, halign: 'center', font: 'courier' },
      5: { cellWidth: 18, halign: 'right', font: 'courier' },
      6: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 6) {
        const text = String(data.cell.raw);
        if (text === 'Operativo') {
          data.cell.styles.textColor = [16, 185, 129]; // emerald
        } else if (text === 'Degradado') {
          data.cell.styles.textColor = [217, 119, 6]; // amber
        } else if (text === 'Caído') {
          data.cell.styles.textColor = [225, 29, 72]; // rose
        }
      }
    },
    margin: { left: 14, right: 14 },
  });

  // Calculate position after first table
  const finalY = (doc as any).lastAutoTable?.finalY || currentY + 40;
  currentY = finalY + 10;

  // If page space is low, add page for Incident section
  if (currentY > 230) {
    doc.addPage();
    currentY = 20;
  }

  // --- Section 3: Incidents Table ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`3. Registro y Resumen de Incidentes de Seguridad (${totalIncidents} Registrados)`, 14, currentY);
  currentY += 2;

  const incidentRows = incidents.map((inc) => [
    inc.id,
    inc.title,
    inc.threatOriginIp
      ? `${inc.threatOriginIp}${inc.threatOriginCountry ? `\n(${inc.threatOriginCountry})` : ''}`
      : 'No registrada',
    inc.cveId
      ? `${inc.cveId}${inc.cvssScore !== undefined ? `\n(CVSS ${inc.cvssScore.toFixed(1)})` : ''}`
      : 'N/A',
    inc.assetName || 'General',
    inc.severity.toUpperCase(),
    inc.status === 'open'
      ? 'Abierta'
      : inc.status === 'investigating'
      ? 'En Investigación'
      : 'Resuelta',
    new Date(inc.createdAt).toLocaleDateString('es-DO', {
      month: '2-digit',
      day: '2-digit',
      year: '2-digit',
    }),
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['ID', 'Título de la Incidencia', 'Origen Hostil', 'CVE / CVSS', 'Activo', 'Severidad', 'Estado', 'Fecha']],
    body: incidentRows,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59], // slate-800
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
      cellPadding: 2,
    },
    columnStyles: {
      0: { font: 'courier', cellWidth: 16 },
      1: { cellWidth: 48, fontStyle: 'bold' },
      2: { cellWidth: 32, font: 'courier' },
      3: { cellWidth: 26 },
      4: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
      5: { cellWidth: 20, halign: 'center' },
      6: { cellWidth: 14, halign: 'center', font: 'courier' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 4) {
        const sev = String(data.cell.raw);
        if (sev === 'CRITICAL') {
          data.cell.styles.textColor = [225, 29, 72]; // rose
          data.cell.styles.fillColor = [255, 241, 242];
        } else if (sev === 'HIGH') {
          data.cell.styles.textColor = [217, 119, 6]; // amber
          data.cell.styles.fillColor = [254, 243, 199];
        } else if (sev === 'MEDIUM') {
          data.cell.styles.textColor = [14, 116, 144]; // cyan
        } else {
          data.cell.styles.textColor = [100, 116, 139]; // slate
        }
      }
      if (data.section === 'body' && data.column.index === 5) {
        const st = String(data.cell.raw);
        if (st === 'Resuelta') {
          data.cell.styles.textColor = [16, 185, 129];
        } else if (st === 'Abierta') {
          data.cell.styles.textColor = [225, 29, 72];
        } else {
          data.cell.styles.textColor = [217, 119, 6];
        }
      }
    },
    margin: { left: 14, right: 14 },
  });

  // --- Add Page Numbering & Footer to all pages ---
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 285, 196, 285);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('IT-CAR-SECURE · Sistema de Monitoreo y Ciberdefensa SOC', 14, 290);
    doc.text(`Página ${i} de ${totalPages}`, 196, 290, { align: 'right' });
  }

  // Save the PDF
  const filename = `informe-soc-it-car-secure-${now.toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
