# Build stage for frontend
FROM node:18-alpine AS frontend-build
WORKDIR /app/client
# Prevent CRA from failing on warnings and fix OpenSSL in Node 18
ENV CI=true
ENV NODE_OPTIONS=--openssl-legacy-provider
ENV GENERATE_SOURCEMAP=false
COPY client/package*.json ./
RUN npm install --legacy-peer-deps
COPY client/ .
RUN npm run build
# Fail the image build if client build was not produced
RUN test -d build && test -f build/index.html || (echo "Client build failed: no build/ or index.html" && exit 1)

# Build stage for backend
FROM node:18-alpine AS backend-build
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install
COPY server/ .

# Production stage
FROM node:18-alpine
WORKDIR /app

# Copy built frontend (React build output)
COPY --from=frontend-build /app/client/build ./client/build

# Verify client build is present
RUN test -f /app/client/build/index.html || (echo "Missing client build in final image" && exit 1)

# Copy backend
COPY --from=backend-build /app/server ./server

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Expose the port
EXPOSE 5000

# Start the server
WORKDIR /app/server
CMD ["node", "server.js"] 