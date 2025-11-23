FROM node:22

WORKDIR /app

# Install pnpm and turso CLI
RUN npm install -g pnpm && \
    curl -sSfL https://get.tur.so/install.sh | bash || true

ENV PATH="/root/.turso:$PATH"

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy application code
COPY . .

# Expose port (configurable via WEB_PORT env var)
EXPOSE 3000

# Default command (can be overridden in docker-compose)
CMD ["npm", "run", "dev"]
