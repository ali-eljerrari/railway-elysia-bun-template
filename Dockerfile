# Use Bun official image as base
FROM oven/bun:1.1-slim AS base

# Set working directory
WORKDIR /app

# Copy dependency files
COPY package.json bun.lockb* ./

# Install dependencies
RUN bun install --frozen-lockfile --production

# Development stage
FROM base AS dev
RUN bun install --frozen-lockfile
COPY . .
CMD ["bun", "run", "dev"]

# Build stage
FROM base AS build
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

# Production stage
FROM debian:bookworm-slim AS production

# Install necessary runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Set working directory
WORKDIR /app

# Copy the compiled binary from build stage
COPY --from=build /app/dist/elysia-server /app/elysia-server

# Change ownership to non-root user
RUN chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 3000

# Set environment variables
ARG NODE_ENV
ENV NODE_ENV=${NODE_ENV}
ARG PORT
ENV PORT=${PORT}


# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Start the application
CMD ["./elysia-server"]
