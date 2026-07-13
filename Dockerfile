# Stage 1: Instalar dependencias de producción
# Separamos install del código para aprovechar la caché de Docker:
# si no cambia package.json, no se vuelve a ejecutar npm install.
FROM node:22-alpine AS deps

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev       # instala solo dependencias de producción, sin devDependencies

# Stage 2: Runtime
# Imagen mínima Alpine — equivalente a mcr.microsoft.com/dotnet/aspnet
FROM node:22-alpine AS runtime

WORKDIR /app

# Security: usuario no-root con UID numérico explícito
RUN addgroup -g 1001 appuser && adduser -u 1001 -G appuser -S appuser

# Copiamos node_modules del stage anterior y el código fuente
COPY --from=deps /app/node_modules ./node_modules
COPY server.js ./
COPY package.json ./

RUN chown -R appuser:appuser /app

EXPOSE 8080

USER 1001

ENV NODE_ENV=production \
    PORT=8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget -qO- http://localhost:8080/api/v1/health || exit 1

ENTRYPOINT ["node", "server.js"]
