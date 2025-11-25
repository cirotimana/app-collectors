# ===============================
# Etapa 1: Construccion
# ===============================
FROM node:20-alpine AS builder

WORKDIR /app-collectors

# Copiar archivos de configuracion e instalacion
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copiar todo el codigo fuente
COPY . .

# Construir el proyecto Next.js
RUN npm run build

# ===============================
# Etapa 2: Servidor de produccion
# ===============================
FROM node:20-alpine AS runner

WORKDIR /app-collectors

# Copiar solo lo necesario desde la etapa anterior
COPY --from=builder /app-collectors/package*.json ./
COPY --from=builder /app-collectors/.next ./.next
COPY --from=builder /app-collectors/public ./public

# Instalar solo dependencias de produccion
RUN npm install --production --legacy-peer-deps

# Variables de entorno
ENV NODE_ENV=production
ENV PORT=3030

# Exponer puerto
EXPOSE 3030

# Comando de inicio
CMD ["npm", "start"]
