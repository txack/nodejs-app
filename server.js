'use strict';

const express = require('express');
const pinoHttp = require('pino-http');
const pino = require('pino');

// ------------------------------------------------------------------
// Logging: JSON estructurado a stdout
// El operador EDOT recogerá estos logs desde /var/log/pods
// ------------------------------------------------------------------
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label }),        // escribe "info" en vez de 30
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

const httpLogger = pinoHttp({ logger });

// ------------------------------------------------------------------
// Express
// ------------------------------------------------------------------
const app = express();
const PORT = process.env.PORT || 8080;

// Nombre del servicio (hardcodeado — toda la config de OTEL es responsabilidad del operador)
const SERVICE_NAME = 'nodejs-otel-test';
const ENVIRONMENT   = 'development';

app.use(httpLogger);    // log de cada request HTTP entrante
app.use(express.json());

// ------------------------------------------------------------------
// Endpoints (equivalentes a HealthController en Java y .NET)
// ------------------------------------------------------------------

// GET / — información del servicio y mapa de endpoints
app.get('/', (_req, res) => {
  logger.debug('Root endpoint accessed');
  res.json({
    service:   SERVICE_NAME,
    message:   `Welcome to ${SERVICE_NAME}`,
    environment: ENVIRONMENT,
    endpoints: {
      api:     '/api/v1/info',
      health:  '/api/v1/health',
      docs:    '(no swagger en Node — usa los endpoints directamente)',
      metrics: '/metrics',
    },
  });
});

// GET /api/v1/health — health check
app.get('/api/v1/health', (_req, res) => {
  logger.debug('Health check requested');
  res.json({ status: 'UP', service: SERVICE_NAME });
});

// GET /api/v1/info — información de la aplicación
app.get('/api/v1/info', (_req, res) => {
  logger.debug('Info requested');
  res.json({
    name:        SERVICE_NAME,
    description: 'Node.js app piloto con auto-instrumentación EDOT',
    version:     '1.0.0',
  });
});

// ------------------------------------------------------------------
// Arranque
// ------------------------------------------------------------------
app.listen(PORT, () => {
  logger.info({ port: PORT, environment: ENVIRONMENT }, `Starting ${SERVICE_NAME}`);
});
