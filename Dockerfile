# ==========================================
# STAGE 1: Build the React Web App
# ==========================================
FROM node:18-alpine AS frontend-build
WORKDIR /app/client

# Copy frontend package.json and install dependencies
COPY client/package*.json ./
RUN npm ci

# Copy the rest of the frontend code and build it
COPY client/ ./
RUN npm run build

# ==========================================
# STAGE 2: Setup the Node Backend & Merge
# ==========================================
FROM node:18-alpine
WORKDIR /app/server

# Copy backend package.json and install dependencies
COPY server/package*.json ./
RUN npm ci

# Copy the rest of the backend code
COPY server/ ./

# MAGIC TRICK: Copy the built React app from Stage 1 into the backend's 'public' folder
COPY --from=frontend-build /app/client/build ./public

# Expose the single port your backend runs on
EXPOSE 3000

# Start the Node server
CMD ["npm", "start"]