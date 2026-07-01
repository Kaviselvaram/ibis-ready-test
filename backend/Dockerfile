# Ibis backend — production image.
# Build from the REPOSITORY ROOT (the backend imports ../../shared):
#   docker build -f backend/Dockerfile -t ibis-backend .
#
# Stateless by design (JWT + Redis), so run N replicas behind a load balancer.
FROM node:20-slim AS runner
ENV NODE_ENV=production
WORKDIR /app

# Install production deps at the /app level (the common parent of backend/ and
# shared/) so BOTH `backend/*` and `shared/*` resolve node_modules via the ESM
# walk-up. Installing under backend/ breaks `shared` imports (e.g. zod).
COPY backend/package.json ./package.json
RUN npm install --omit=dev --no-audit --no-fund

# App source + shared contracts (backend files import ../../../shared/...)
COPY backend ./backend
COPY shared ./shared

WORKDIR /app/backend
EXPOSE 4000
# Render injects PORT at runtime; the app reads process.env.PORT.
USER node
HEALTHCHECK --interval=30s --timeout=4s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||4000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
