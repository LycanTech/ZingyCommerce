# -------------------------------------------------------
# Dockerfile for User Service
#
# What is Docker?
#   Docker packages your app + all its dependencies into
#   a "container" — a box that runs the same everywhere:
#   your laptop, a server, or Azure Kubernetes Service.
#
# Multi-stage build:
#   Stage 1 (builder): installs npm packages
#   Stage 2 (runtime): copies only what's needed to run
#   This keeps the final image small and secure.
# -------------------------------------------------------

# Stage 1 — Install dependencies
FROM node:20-alpine AS builder
WORKDIR /app
# Copy only package files first (Docker cache optimization)
# If package.json hasn't changed, Docker reuses this cached layer
COPY package*.json ./
RUN npm install --omit=dev

# Stage 2 — Runtime image
FROM node:20-alpine
WORKDIR /app
# Copy the installed node_modules from builder stage
COPY --from=builder /app/node_modules ./node_modules
# Copy the actual application code
COPY . .
# Tell Docker which port this container listens on (documentation only)
EXPOSE 3001
# The command to run when the container starts
CMD ["node", "src/index.js"]
