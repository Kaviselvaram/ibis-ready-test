# Ibis backend — production image.
# Build from the REPOSITORY ROOT (the backend imports ../../shared):
#   docker build -f backend/Dockerfile -t ibis-backend .
#   docker run -p 4000:4000 --env-file .env.local ibis-backend
#
# Stateless by design (JWT + Redis), so run N replicas behind a load balancer.
FROM node:20-slim AS deps
WORKDIR /app/backend
COPY backend/package.json ./
RUN npm install --omit=dev --no-audit --no-fund

FROM node:20-slim AS runner
ENV NODE_ENV=production
ENV PORT=4000
WORKDIR /app/backend
# Production dependencies
COPY --from=deps /app/backend/node_modules ./node_modules
# App source + shared contracts (backend resolves ../../../shared/...)
COPY backend ./
COPY shared /app/shared
EXPOSE 4000
# Least-privilege: run as the built-in non-root user
USER node
# Container-level liveness check
HEALTHCHECK --interval=30s --timeout=4s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||4000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
