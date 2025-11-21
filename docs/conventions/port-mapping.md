# Port Mapping Convention

## Overview

This project uses a consistent port mapping strategy where Docker services listen on the same port inside the container as they expose on the host machine. This convention simplifies development, especially when working with multiple worktrees or development servers.

**Important**: Port numbers are arbitrary and can be any available port. The examples here use 3090 and 8081, but you can choose any ports that don't conflict with other services on your system.

## The Pattern

### Environment Variables

Port configuration is centralized in `.env`:

```env
WEB_PORT=3090  # Arbitrary - choose any available port
DB_PORT=8081   # Arbitrary - choose any available port
```

### Docker Compose Configuration

Services are configured to use the same port internally and externally:

**Web Service:**

```yaml
web:
  ports:
    - '${WEB_PORT:-3000}:${WEB_PORT:-3000}'
  command: node_modules/.bin/next dev --port ${WEB_PORT:-3000}
```

**Database Service:**

```yaml
db:
  environment:
    - SQLD_HTTP_LISTEN_ADDR=0.0.0.0:${DB_PORT:-8080}
  ports:
    - '${DB_PORT:-8080}:${DB_PORT:-8080}'
```

## Benefits

### 1. Consistent Log Output

When viewing container logs, the port shown matches the host port:

```bash
$ docker compose logs web
web-1  | ▲ Next.js 15.0.0
web-1  | - Local:        http://localhost:3090
web-1  | - Network:      http://0.0.0.0:3090
```

The logged port (3090) is the actual port you access on localhost:3090.

### 2. Simplified Port Conflict Resolution

When working with multiple worktrees or development servers, each can use different ports by simply updating `.env`. Port numbers are arbitrary - choose any available ports:

**Worktree 1 (.env):**

```env
WEB_PORT=3000  # Could be 4000, 5000, etc.
DB_PORT=8080   # Could be 9000, 9001, etc.
```

**Worktree 2 (.env):**

```env
WEB_PORT=3090  # Could be 4090, 5090, etc.
DB_PORT=8081   # Could be 9010, 9011, etc.
```

**Worktree 3 (.env):**

```env
WEB_PORT=3100  # Could be 4100, 5100, etc.
DB_PORT=8082   # Could be 9020, 9021, etc.
```

### 3. Clear Container-to-Container Communication

Internal service URLs use the same ports as external access:

```yaml
web:
  environment:
    # Database URL uses DB_PORT consistently
    - DATABASE_URL=http://db:${DB_PORT:-8080}

e2e:
  environment:
    # Playwright connects to web service on same port
    - PLAYWRIGHT_BASE_URL=http://web:${WEB_PORT:-3000}
```

### 4. Easier Debugging

When debugging, you can immediately see which port a service is using:

```bash
# Check what port the web service is listening on
$ docker compose logs web | grep -i "listening\|local"
web-1  | - Local:        http://localhost:3090

# Access the service on that exact port
$ curl http://localhost:3090
```

## Usage Examples

### Setting Up a New Worktree

1. Create worktree:

   ```bash
   git worktree add ../meze-feature feature-branch
   cd ../meze-feature
   ```

2. Copy and modify `.env`:

   ```bash
   cp ../.env .env
   # Edit .env to use different ports
   # WEB_PORT=3100
   # DB_PORT=8082
   ```

3. Start services:
   ```bash
   make up
   ```

Now both worktrees can run simultaneously without port conflicts.

### Running Multiple Development Servers

Different team members or features can run side-by-side. Port numbers are arbitrary - these are just examples:

- Main development: localhost:3000 (or any available port)
- Feature branch 1: localhost:3090 (or 4000, 5000, etc.)
- Feature branch 2: localhost:3100 (or 4100, 5100, etc.)
- Staging replica: localhost:4000 (or 6000, 7000, etc.)

Each just needs a unique `.env` configuration with non-conflicting ports.

### Checking Service Status

With MCP Docker tools or direct Docker commands:

```bash
# List containers with their port mappings
docker compose ps

# Check logs to see which port a service is actually listening on
docker compose logs web

# The port in logs matches the host port
```

## Implementation Details

### Default Values

All port mappings include sensible defaults:

- `${WEB_PORT:-3000}`: Defaults to 3000 if WEB_PORT not set
- `${DB_PORT:-8080}`: Defaults to 8080 if DB_PORT not set

This ensures the project works out-of-the-box while allowing easy customization.

### Service Communication

Services communicate using service names and the environment variable ports:

```yaml
# web service connecting to db
DATABASE_URL=http://db:${DB_PORT:-8080}

# e2e service connecting to web
PLAYWRIGHT_BASE_URL=http://web:${WEB_PORT:-3000}
```

Docker's internal DNS resolves service names (e.g., `db`, `web`) to container IPs, while the port remains consistent.

### Health Checks

Health checks use the same port pattern:

```yaml
web:
  healthcheck:
    test:
      [
        'CMD',
        'curl',
        '-f',
        'http://localhost:${WEB_PORT:-3000}/api/health/readiness',
      ]
```

The health check URL matches the actual service port.

## Best Practices

1. **Always use .env for ports**: Never hardcode ports in docker-compose.yaml or application code
2. **Keep .env local**: Add `.env` to `.gitignore` to avoid port conflicts between developers
3. **Port numbers are arbitrary**: Choose any available ports that work for your system - there's nothing special about the examples shown (3090, 8081, etc.)
4. **Document port usage**: When adding new services, follow this same pattern
5. **Use descriptive names**: Port variable names should clearly indicate their purpose (e.g., `WEB_PORT`, `DB_PORT`, `REDIS_PORT`)
6. **Choose non-conflicting ranges**: When creating multiple environments, use well-separated port ranges to avoid confusion

## Adding New Services

When adding a new service, follow this pattern:

1. Add port variable to `.env`:

   ```env
   REDIS_PORT=6379
   ```

2. Configure Docker Compose consistently:

   ```yaml
   redis:
     ports:
       - '${REDIS_PORT:-6379}:${REDIS_PORT:-6379}'
     command: redis-server --port ${REDIS_PORT:-6379}
   ```

3. Update dependent services:
   ```yaml
   web:
     environment:
       - REDIS_URL=redis://redis:${REDIS_PORT:-6379}
   ```

## Troubleshooting

### Port Already in Use

If you get "port already in use" errors:

```bash
# Check what's using the port
sudo lsof -i :3090

# Either stop that service or change WEB_PORT in .env
```

### Container Port vs Host Port Mismatch

If logs show a different port than you're accessing:

1. Check `.env` file for correct port values
2. Restart services: `make down && make up`
3. Verify docker-compose.yaml uses environment variables correctly

### Service Communication Failing

If services can't communicate:

1. Ensure all services use `${PORT_VAR:-default}` syntax
2. Check that dependent services reference the same environment variable
3. Verify services are on the same Docker network

## Related Documentation

- `docker-compose.yaml`: Complete service configuration
- `Makefile`: Convenience commands for Docker operations
- `CLAUDE.md`: General development guidelines
