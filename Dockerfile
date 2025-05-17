FROM oven/bun:1.0-slim

WORKDIR /app

# Copy package.json and other config files
COPY package.json .
COPY bun.lockb .
COPY tsconfig.json .

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY src ./src
COPY public ./public

# Set environment variables
ARG PORT=3000
ENV PORT=${PORT}

# Expose the port
EXPOSE ${PORT}

# Start the application
CMD ["bun", "run", "src/index.ts"]
