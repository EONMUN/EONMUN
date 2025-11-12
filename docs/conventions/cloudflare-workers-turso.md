# Cloudflare Workers Deployment & Turso Database Integration

This document outlines how the Meze application is deployed to Cloudflare Pages using Cloudflare Workers, and how it integrates with Turso for production database access via the Drizzle web libSQL client.

## Architecture Overview

### Technology Stack

- **Deployment Platform**: Cloudflare Pages with Cloudflare Workers
- **Build Tool**: OpenNext.js (Next.js adapter for Cloudflare)
- **Database (Production)**: Turso (managed SQLite at the edge)
- **Database (Development)**: SQLite (local)
- **ORM**: Drizzle ORM with web libSQL client
- **Client Library**: `@libsql/client/web` (works in edge environments)

### Deployment Flow

```
Local Development
    ↓ (npm run deploy)
Build & Bundle (Next.js)
    ↓ (OpenNext.js)
Edge-Compatible Code
    ↓
Cloudflare Workers
    ↓
Database Layer (Turso or Local SQLite)
```

## Cloudflare Workers & OpenNext.js

### What is OpenNext.js?

OpenNext.js is an adapter that transforms Next.js applications to run on Cloudflare Pages with Cloudflare Workers. It:

1. Builds the Next.js application
2. Separates server and client code
3. Creates worker entry points for Cloudflare
4. Bundles edge-compatible middleware
5. Handles ISR (Incremental Static Regeneration) with R2

### Configuration

**File**: `open-next.config.ts`

```typescript
import { defineCloudflareConfig } from '@opennextjs/cloudflare';

export default defineCloudflareConfig({
  // Optional: Enable R2 caching for ISR
  // incrementalCache: r2IncrementalCache,
});
```

**Key Points**:

- Currently using default Cloudflare configuration
- R2 cache can be enabled for improved ISR performance
- Configuration is minimal—most defaults work well

### How It Works

1. **Build Phase**:
   - Next.js builds the application
   - Server components/actions compiled to worker functions
   - API routes converted to Cloudflare Workers handlers

2. **Runtime Phase**:
   - Request comes to Cloudflare
   - Worker executes server logic
   - Can access database via libSQL client
   - Returns HTML/JSON response

3. **Database Access**:
   - Workers execute server code
   - Access database via Drizzle ORM + libSQL
   - Results sent back to client

## Database Architecture

### Drizzle ORM with Web LibSQL Client

The application uses Drizzle ORM paired with the **web-based libSQL client** (`@libsql/client/web`). This is critical for Cloudflare Workers compatibility.

**Why web libSQL?**

- Node.js clients won't work in Cloudflare Workers (no file system)
- The web client uses HTTP to communicate with Turso
- Works in both edge and traditional server environments
- Cross-platform compatibility

### Client Configuration

**File**: `src/lib/db/index.ts`

```typescript
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client/web';

export function createDatabaseClient() {
  // Production: Turso with authentication
  if (process.env.TURSO_AUTH_TOKEN && process.env.TURSO_DATABASE_URL) {
    const client = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    return drizzle(client, { schema });
  }

  // Development: Local SQLite or Turso
  const client = createClient({
    url:
      process.env.DATABASE_URL ||
      `http://localhost:${process.env.DB_PORT || 8080}`,
  });
  return drizzle(client, { schema });
}

export const db = createDatabaseClient();
```

**Key Behavior**:

1. Checks for `TURSO_AUTH_TOKEN` and `TURSO_DATABASE_URL`
2. If present, creates authenticated Turso client
3. If absent, uses local SQLite (development)
4. Returns Drizzle ORM instance with full type safety

### Database Options

#### Production: Turso

Turso is SQLite hosted at the edge with:

- Global replication
- Low-latency connections from anywhere
- HTTP-based access (perfect for serverless)
- Compatible with Cloudflare Workers

**Environment Variables**:

```bash
TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your_auth_token
```

#### Development: Local SQLite

Use a local SQLite database or Turso replica for development:

**Option 1: Docker SQLite**

```bash
# Runs in Docker on localhost:8080
make up
```

**Option 2: Environment Variable**

```bash
DATABASE_URL=http://localhost:8080
DB_PORT=8080
```

### Schema & Migrations

**File**: `drizzle.config.ts`

```typescript
import { defineConfig } from 'drizzle-kit';
import { config } from 'dotenv';

config({ path: '.env.local', quiet: true });

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  ...(process.env.TURSO_AUTH_TOKEN
    ? {
        dialect: 'turso',
        dbCredentials: {
          url: process.env.TURSO_DATABASE_URL!,
          authToken: process.env.TURSO_AUTH_TOKEN,
        },
      }
    : {
        dialect: 'sqlite',
        dbCredentials: {
          url:
            process.env.DATABASE_URL ||
            `http://localhost:${process.env.DB_PORT || 8080}`,
        },
      }),
});
```

**Key Points**:

- Automatically selects Turso or SQLite based on environment
- Migrations stored in `drizzle/` directory
- Run `npm run db:generate` to generate new migrations
- Run `npm run db:migrate` to apply migrations

## Deployment Process

### Prerequisites

1. **Cloudflare Account**: [Sign up at cloudflare.com](https://cloudflare.com)
2. **GitHub CLI (`gh`)**: Installed and authenticated
3. **Turso Database**: Created and credentials available
4. **Git Push**: Code committed to repository

### Environment Setup

The project uses **GitHub Actions** for automated deployments to three environments:

| Environment | Branch | URL | Database | Secrets Suffix |
|-------------|--------|-----|----------|----------------|
| **Production** | `master` | https://eonmun.com | Production | _(none)_ |
| **Next** | `next` | https://next.eonmun.com | Preview | `_PREVIEW` |
| **Preview** | Pull Requests | https://pr-{number}.eonmun.com | Preview | `_PREVIEW` |

**Note**: Both `next` and `preview` environments currently share the same preview database.

#### Setting Up Secrets

1. **Create environment files** in `web/`:

   ```bash
   cd web
   cp .env.production.example .env.production
   cp .env.next.example .env.next
   cp .env.preview.example .env.preview
   ```

2. **Fill in your credentials** in each file:

   ```bash
   # .env.production
   TURSO_DATABASE_URL=libsql://production-db.turso.io
   TURSO_AUTH_TOKEN=your_production_token
   CLOUDFLARE_API_TOKEN=your_cloudflare_token
   CLOUDFLARE_ACCOUNT_ID=your_account_id

   # .env.next
   TURSO_DATABASE_URL=libsql://next-db.turso.io
   TURSO_AUTH_TOKEN=your_next_token
   # ... same Cloudflare credentials

   # .env.preview
   TURSO_DATABASE_URL=libsql://preview-db.turso.io
   TURSO_AUTH_TOKEN=your_preview_token
   # ... same Cloudflare credentials
   ```

3. **Upload secrets to GitHub** using the `gh-secrets` script:

   ```bash
   # Upload all environments (recommended)
   bin/gh-secrets

   # Or upload specific environments
   bin/gh-secrets --production-only
   bin/gh-secrets --next-only
   bin/gh-secrets --preview-only

   # Dry run to see what would be uploaded
   bin/gh-secrets --dry-run
   ```

   This creates GitHub Actions secrets in environment-specific stores:
   - `production` environment: `TURSO_AUTH_TOKEN`, `TURSO_DATABASE_URL` (from .env.production)
   - `preview` environment: `TURSO_AUTH_TOKEN`, `TURSO_DATABASE_URL` (from .env.preview)
   - `next` environment: Uses secrets from `next` environment (same values as preview)
   - `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` (repository secrets, shared across all)

**Note**: Variables starting with `NEXT_PUBLIC_` are **not** uploaded as secrets. Add them to `web/wrangler.jsonc` instead:

```jsonc
{
  "env": {
    "production": {
      "vars": {
        "NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID": "...",
        "NEXT_PUBLIC_INFURA_KEY": "..."
      }
    }
  }
}
```

### Deployment Steps

The project uses **GitHub Actions** for automated deployments. No manual deployment commands are needed.

#### Production Deployment (master branch)

1. **Push to master**:
   ```bash
   git push origin master
   ```

2. **Automatic workflow** (`.github/workflows/deploy-web.yml`):
   - Builds Next.js app with `opennextjs-cloudflare build`
   - Deploys to Cloudflare Workers
   - Uploads runtime secrets
   - Deploys to https://eonmun.com

#### Next Deployment (next branch)

1. **Push to next**:
   ```bash
   git push origin next
   ```

2. **Automatic workflow** (`.github/workflows/deploy-web.yml`):
   - Builds and deploys to `next` wrangler environment
   - Uses secrets from `next` GitHub environment (shares preview database values)
   - Deploys to https://next.eonmun.com

#### Preview Deployment (Pull Requests)

1. **Create a Pull Request**:
   ```bash
   git checkout -b feature/my-feature
   git push origin feature/my-feature
   # Create PR on GitHub
   ```

2. **Automatic workflow** (`.github/workflows/web.test.yml`):
   - Runs linting and type checking
   - Builds and deploys to `preview` wrangler environment
   - Uses `_PREVIEW` suffixed secrets
   - Comments on PR with preview URL
   - Deploys to https://pr-{number}.eonmun.com

3. **Cleanup**: When PR is closed, preview environment is automatically cleaned up

#### Manual Deployment (Local)

For manual deployments or testing:

```bash
cd web

# Build for Cloudflare
npx opennextjs-cloudflare build

# Preview locally (optional)
npx opennextjs-cloudflare preview

# Deploy to Cloudflare (requires wrangler auth)
npx opennextjs-cloudflare deploy --env production
```

### What Happens During Deployment

#### GitHub Actions Workflow

1. **Code Push/PR**:
   - Developer pushes to `master`, `next`, or creates a PR
   - GitHub Actions workflow triggers

2. **Build Phase** (`.github/actions/deploy-cloudflare-worker`):
   - Checks out code
   - Sets up Node.js
   - Installs dependencies (`npm ci`)
   - Builds Next.js app (`opennextjs-cloudflare build`)
   - Creates `.open-next/` directory with worker code

3. **Deploy Phase**:
   - Deploys to Cloudflare Workers (`opennextjs-cloudflare deploy`)
   - Uploads runtime secrets via `wrangler secret put`
   - Secrets are injected into worker environment

4. **Activation Phase**:
   - New deployment becomes active
   - Receives traffic based on environment
   - Database connections use environment-specific Turso credentials

### Verifying Deployment

1. **Check GitHub Actions**:
   - Visit `https://github.com/{owner}/{repo}/actions`
   - View workflow run status
   - Check deployment summary in workflow output

2. **Test Deployment**:
   - **Production**: Visit https://eonmun.com
   - **Next**: Visit https://next.eonmun.com
   - **Preview**: Check PR comment for deployment URL
   - Verify database connectivity
   - Check API routes work

3. **View Logs**:
   ```bash
   # Real-time worker logs (requires wrangler auth)
   cd web
   npx wrangler tail --env production --follow

   # Or view in Cloudflare dashboard
   # Workers & Pages → eonmun-web → Logs
   ```

4. **Local Preview** (before deploying):
   ```bash
   cd web
   npx opennextjs-cloudflare build
   npx opennextjs-cloudflare preview
   ```

## Development vs Production

### Development Environment

| Component          | Setup                               |
| ------------------ | ----------------------------------- |
| **Server**         | Next.js dev server (localhost:3000) |
| **Database**       | Docker SQLite (localhost:8080)      |
| **Client Library** | `@libsql/client/web` (via HTTP)     |
| **Migrations**     | Run via `npm run db:migrate`        |
| **Environment**    | `.env.local` and `.env`             |

**Start Development**:

```bash
make up          # Starts dev server and SQLite
npm run dev      # Alternative without Make
```

### Production Environment

| Component          | Setup                                    |
| ------------------ | ---------------------------------------- |
| **Server**         | Cloudflare Workers                       |
| **Database**       | Turso (managed SQLite)                   |
| **Client Library** | `@libsql/client/web` (via HTTP to Turso) |
| **Migrations**     | Applied during deployment                |
| **Environment**    | Cloudflare Pages secrets                 |

**Automatic on Deploy**:

```bash
npm run deploy
```

## Common Tasks

### Update Turso Database Schema

```bash
# 1. Modify schema in src/lib/db/schema.*.ts

# 2. Generate migration
cd web
npm run db:generate

# 3. Test locally
npm run db:migrate

# 4. Deploy to production
git add drizzle/
git commit -m "feat: update database schema"
git push origin master  # Auto-deploys via GitHub Actions
```

### Update Secrets

When secrets change (e.g., rotating Turso auth tokens):

```bash
# 1. Update .env files
vim web/.env.production
vim web/.env.next
vim web/.env.preview

# 2. Upload to GitHub Actions
bin/gh-secrets

# 3. Re-deploy to apply new secrets
# Option A: Push a commit to trigger deployment
git commit --allow-empty -m "chore: rotate secrets"
git push origin master

# Option B: Manually re-run workflow in GitHub Actions UI
```

### Create Database Replica for Development

```bash
# Using Turso CLI
turso db create meze-dev --from-db meze

# Get URL
turso db show meze-dev --url

# Set in .env.local
DATABASE_URL=libsql://meze-dev-username.turso.io
```

### View Database in Production

```bash
# Using Drizzle Studio (requires local auth token)
TURSO_CONNECTION_URL="libsql://your-db.turso.io" \
TURSO_AUTH_TOKEN="your_token" \
npm run db:studio
```

### Rollback Deployment

If deployment causes issues:

```bash
# Option 1: Revert the commit and push
git revert HEAD
git push origin master  # Triggers auto-deployment

# Option 2: Deploy a specific commit
git checkout {good-commit-sha}
git push -f origin master  # Forces deployment of that commit
```

Cloudflare automatically keeps previous versions available. You can also rollback via the Cloudflare dashboard.

### View Worker Logs

```bash
# Real-time tail (requires authentication)
wrangler tail --follow

# Via Cloudflare Dashboard
# Workers & Pages → your-site → Analytics
```

## Troubleshooting

### Deployment Fails: "Auth token invalid"

**Problem**: Deployment can't connect to Turso

**Solution**:

1. Verify `TURSO_AUTH_TOKEN` in Cloudflare Pages settings
2. Check token hasn't expired: `turso token validate`
3. Create new token if needed: `turso db tokens create meze`

### Database Connection Times Out

**Problem**: Requests hang when accessing database

**Possible Causes**:

1. Network connectivity issues in worker
2. Turso database offline
3. Query too complex/slow

**Solutions**:

```bash
# Check Turso status
turso status

# View worker logs
wrangler tail --follow

# Test connectivity
wrangler remote exec 'SELECT 1'
```

### "Cannot find module '@libsql/client/web'"

**Problem**: Build fails with missing module

**Solution**:

```bash
# Reinstall dependencies
npm install

# Verify package.json has correct package
npm ls @libsql/client
```

**Note**: Never use `@libsql/client` (Node.js version) in worker code

### Environment Variables Not Available in Worker

**Problem**: `process.env.TURSO_AUTH_TOKEN` is undefined

**Solution**:

1. Check secrets are uploaded to GitHub:
   ```bash
   gh secret list
   ```

2. Verify environment file has correct values:
   ```bash
   cat web/.env.production  # Should have TURSO_AUTH_TOKEN=...
   ```

3. Re-upload secrets:
   ```bash
   bin/gh-secrets --production-only
   ```

4. Trigger new deployment:
   ```bash
   git commit --allow-empty -m "chore: update secrets"
   git push origin master
   ```

5. Check GitHub Actions workflow logs for secret upload step

### ISR Not Working

**Problem**: Static pages don't regenerate

**Causes**:

1. R2 caching not configured
2. Revalidation path incorrect
3. Route not marked `revalidate: number`

**Solution**:

```typescript
// In page.tsx
export const revalidate = 3600; // Revalidate every hour
```

## Performance Considerations

### Database Query Optimization

1. **Connection Pooling**: Handled by Turso automatically
2. **Query Batching**: Combine multiple queries when possible
3. **Caching**: Use Next.js cache() for expensive queries
4. **Indexes**: Ensure frequently-queried columns are indexed

### Worker Cold Starts

- First request to worker takes longer (~100-500ms)
- Subsequent requests much faster (<10ms)
- Turso connections are HTTP-based (slightly slower than local DB)

### Cost Optimization

- **Cloudflare Pages**: Free tier includes generous worker compute
- **Turso**: Pay-per-request pricing (~$0.25 per million requests)
- **R2**: Costs for ISR caching (~$0.015 per GB)

## Related Documentation

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Turso Documentation](https://docs.turso.tech/)
- [Drizzle ORM - libSQL](https://orm.drizzle.team/docs/get-started-sqlite#libsql)
- [OpenNext.js Cloudflare Guide](https://opennext.js.org/cloudflare/overview)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- See `bin/README.md` for `gh-secrets` script usage
- See `docs/TURSO_INTEGRATION.md` for additional Turso setup details
- See `src/lib/db/README.md` for database operations and migrations

## GitHub Actions Workflows

The project uses automated deployments via GitHub Actions:

### Production Deployment (`.github/workflows/deploy-web.yml`)

**Triggers**: Push to `master` or `next` branch

**Jobs**:
- `deploy-production`: Deploys to https://eonmun.com (master branch)
  - Uses `environment: production` and `concurrency: production`
  - Uploads runtime secrets BEFORE build and deploy
- `deploy-next`: Deploys to https://next.eonmun.com (next branch)
  - Uses `environment: preview` and `concurrency: next`
  - Uploads runtime secrets BEFORE build and deploy

**Steps**:
1. Checkout code
2. Setup Node.js with npm cache
3. Install dependencies
4. Upload runtime secrets to Cloudflare (BEFORE build)
5. Build Next.js app with opennextjs-cloudflare
6. Deploy to Cloudflare Workers

**Required Secrets**:
- `CLOUDFLARE_API_TOKEN` (from production/preview environment)
- `CLOUDFLARE_ACCOUNT_ID` (from production/preview environment)
- `TURSO_AUTH_TOKEN` (from production/preview environment)
- `TURSO_DATABASE_URL` (from production/preview environment)

### Preview Deployment (`.github/workflows/web.test.yml`)

**Triggers**: Pull requests to `master` branch

**Jobs**:
1. `lint-and-typecheck`: Runs ESLint and TypeScript checks
2. `deploy-preview`: Deploys to preview environment (only if tests pass)
   - Uses `environment: production` and `concurrency: production`
   - Uploads runtime secrets BEFORE build and deploy
   - Comments on PR with preview URL
3. `cleanup-preview`: Removes preview when PR is closed

**Features**:
- ✅ Automated testing before deployment
- ✅ PR comments with preview URL
- ✅ Automatic cleanup on PR close
- ✅ Uses separate preview database
- ✅ Secrets uploaded before build to prevent runtime errors

**Required Secrets** (from production environment):
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `TURSO_AUTH_TOKEN`
- `TURSO_DATABASE_URL`

### Deployment Process

All deployment jobs now follow a consistent pattern:

**Process**:
1. Checkout repository
2. Setup Node.js with npm caching
3. Install dependencies (`npm ci`)
4. **Upload runtime secrets to Cloudflare** (TURSO_AUTH_TOKEN, TURSO_DATABASE_URL)
5. Build with `opennextjs-cloudflare build`
6. Deploy with `opennextjs-cloudflare deploy`

**Key Changes**:
- Runtime secrets are uploaded BEFORE build/deploy (not after)
- This ensures secrets are available during the build process
- All jobs use GitHub environment secrets (production or preview)
- Concurrency controls prevent simultaneous deployments to same environment

## Summary

The Meze deployment architecture combines:

1. **Cloudflare Workers** for serverless execution at the edge
2. **Turso** for globally-distributed SQLite databases
3. **Drizzle ORM** with the **web libSQL client** for type-safe database access
4. **OpenNext.js** to bridge Next.js and Cloudflare workers

This setup provides:

- ✅ Global low-latency database access
- ✅ Automatic scaling with no server management
- ✅ Type-safe database operations
- ✅ Same development/production database (SQLite)
- ✅ Seamless local development experience
- ✅ Simple deployment with `npm run deploy`
