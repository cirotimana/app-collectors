# ===============================
# Etapa 1: Construccion
# ===============================
FROM node:20-alpine AS builder

WORKDIR /app

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

WORKDIR /app

# Copiar solo lo necesario desde la etapa anterior
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next

# Si existe carpeta public, se copia (seguro)
# Puedes descomentar si mas adelante agregas assets publicos:
# COPY --from=builder /app/public ./public

# Instalar solo dependencias de produccion
RUN npm install --production --legacy-peer-deps

# Variables de entorno
ENV NODE_ENV=production
ENV PORT=3030

# Exponer puerto
EXPOSE 3030

# Comando de inicio
CMD ["npm", "start"]
