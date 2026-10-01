# IT-CAR-SECURE - Sistema de Monitoreo y Ciberseguridad de Endpoints

Sistema de monitoreo, detección de amenazas, correlación DNS/AD y seguridad de infraestructura tecnológica de alto rendimiento.

## 🚀 Requisitos Previos

- **Node.js**: Versión 18.0 o superior (recomendado Node 20+)
- **npm**: Versión 9.0 o superior (o pnpm / yarn / bun)

## 📦 Instalación

1. Descomprime el archivo `.zip` en el directorio deseado.
2. Abre una terminal en la carpeta raíz del proyecto.
3. Instala las dependencias necesarias:

```bash
npm install
```

## 🛠️ Ejecución en Desarrollo

Para iniciar el servidor de desarrollo local con recarga rápida (HMR):

```bash
npm run dev
```

El aplicativo estará disponible en tu navegador en:
**http://localhost:3000** (o el puerto indicado en la consola).

## 🏗️ Compilación para Producción

Para compilar el proyecto optimizado para producción:

```bash
npm run build
```

Los artefactos listos para desplegar se generarán en la carpeta `/dist`.

Para previsualizar la compilación de producción localmente:

```bash
npm run preview
```

## 🛡️ Características Principales

- **Dashboard Principal**: Telemetría en tiempo real, latencias, uptime, severidades CVSS y estado de endpoints.
- **Gestión de Endpoints**: Auditoría de servicios perimetrales e internos con tiempos de respuesta y códigos HTTP.
- **Threat Hunting**: Detección de patrones maliciosos, técnicas MITRE ATT&CK, indicadores de compromiso (IoC) y análisis forense.
- **Mapa Geoespacial de Amenazas**: Visualización balística de orígenes de ciberataques (IP, ASN, país y vectores de ataque).
- **Correlación AD / DNS**: Detección de inconsistencias entre Active Directory y registros DNS corporativos.
- **Monitoreo de Protocolos Avanzados**: TLS/SSL, certificados próximos a vencer, APIs y transacciones sintéticas.
- **Detección de Shadow AI / IA no Autorizada**: Monitoreo de tráfico hacia plataformas de IA en la red corporativa.
- **Integraciones SIEM & RMM**: Conectores para Wazuh, Atera y Zabbix con alertas unificadas.
- **Exportación de Informes**: Generación de reportes PDF ejecutivos y técnicos, así como exportación completa del código fuente en `.zip`.

## 📜 Licencia

Uso interno y corporativo IT-CAR-SECURE.
