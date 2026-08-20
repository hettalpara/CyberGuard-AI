# ==============================================================================
# CyberGuard AI - Backend Dockerfile (Production Multi-stage)
# ==============================================================================

# --- Stage 1: Build ---
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json tsconfig.json ./

# Install dependencies (including devDependencies for TypeScript compilation)
RUN npm ci

# Copy backend source code
COPY src/ ./src/

# Compile TypeScript to JavaScript in /app/dist
RUN npm run build

# Prune dev dependencies for lean production image
RUN npm prune --production

# --- Stage 2: Production Runner ---
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install curl for container healthchecks
RUN apk add --no-cache curl

# Create non-root user for security
USER node

# Copy built artifacts and production node_modules from builder stage
COPY --chown=node:node --from=builder /app/package*.json ./
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/dist ./dist

# Expose backend API port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

# Start production server
CMD ["node", "dist/server.js"]
