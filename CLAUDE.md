# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

EONMUN is a full-stack Web3 application for an art NFT platform featuring:
- **Frontend**: Next.js React app with Web3 integration and local database
- **Blockchain**: Solidity smart contracts for NFT functionality
- **Infrastructure**: Docker Compose for development

## Architecture

### Project Structure
- Root directory - Next.js frontend application
- `hardhat/` - Ethereum smart contracts and tooling
- `docker-compose.yaml` - Orchestrates development services

### Key Technologies
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS, Wagmi (Web3), PostHog analytics
- **Database**: Drizzle ORM with SQLite (local) / Turso libSQL (production)
- **Blockchain**: Hardhat, OpenZeppelin upgradeable contracts, Viem
- **Deployment**: Cloudflare Workers (OpenNext), Docker

## Development Commands

### Initial Setup
```bash
make init          # Initialize project and start services
```

### Service Management
```bash
make up            # Start all services with Docker Compose
make down          # Stop all services
make build         # Build all Docker services
make destroy       # Clean all services and volumes
```

### Web Application Commands

```bash
npm run dev        # Development server with Turbopack
npm run build      # Standard Next.js production build
npm run lint       # ESLint
npm run typecheck  # TypeScript type checking
npm run wagmi      # Generate Web3 types from contracts

# Database (Drizzle ORM)
npm run db:generate      # Generate migrations from schema changes
npm run db:push          # Push schema changes to database
npm run db:studio        # Open Drizzle Studio (database GUI)
npm run db:fixtures:load # Load fixtures into database

# OpenNext (Cloudflare deployment)
npm run deploy     # Build with OpenNext and deploy to Cloudflare
npm run preview    # Build with OpenNext and preview locally
# Note: OpenNext uses opennextjs-cloudflare, which wraps next build
# and prepares the app for Cloudflare Workers deployment
```

### Smart Contracts
```bash
cd hardhat/
npm test           # Run Hardhat tests
```

### Testing
```bash
make e2e           # Run Playwright e2e tests
npm run test       # Run Vitest tests
npm run test:ui    # Run Vitest with UI
```

## Smart Contract Architecture

The EMN contract is an upgradeable ERC721 NFT contract with:
- **Role-based access**: ADMIN_ROLE and EDITOR_ROLE
- **Royalty support**: ERC2981 for creator royalties
- **Upgradeable**: UUPS proxy pattern
- **Art-focused**: Designed for unique physical artwork representation

Key functions:
- `mintNft()` / `mintNftTo()` - Mint NFTs (EDITOR_ROLE)
- `setTokenURI()` - Update metadata (EDITOR_ROLE)
- `setDefaultRoyalty()` - Configure royalties (EDITOR_ROLE)

## Web3 Integration

The frontend uses Wagmi for Web3 functionality with:
- Wallet connection via Reown AppKit
- Contract interaction through generated types
- Multi-chain support configuration in `wagmi.config.ts`

## Environment Configuration

Required environment files:
- `.env` - Frontend configuration (copy from `.env.example`)

### Database Configuration

The app uses SQLite locally and Turso (libSQL) in production:

**Development** (`.env`):
- Uses local SQLite database (`local.db`)
- Auto-migrates and loads fixtures on startup

**Production** (`.env.production`):
- Requires Turso configuration for libSQL cloud database
- `TURSO_DATABASE_URL` - Turso database URL (e.g., `libsql://your-db.turso.io`)
- `TURSO_AUTH_TOKEN` - Turso authentication token

Note: The database client uses `@libsql/client/web` for compatibility with Cloudflare Workers.

## Development Workflow

1. Run `make init` for first-time setup
2. Use `make up` to start all services
3. Frontend available at `http://localhost:3000`
4. Use fixtures to load test data: `npm run db:fixtures:load`

## Testing

- Smart contracts: `cd hardhat && npm test`
- Frontend linting: `npm run lint`
- Frontend type checking: `npm run typecheck`
- E2E tests: `make e2e`
- Unit tests: `npm run test`

## Deployment

### Frontend Deployment (Cloudflare Workers)

The frontend deploys to Cloudflare Workers using OpenNext:

```bash
npm run deploy     # Build with OpenNext and deploy to Cloudflare
npm run preview    # Build with OpenNext and preview locally
```

**Important:**
- OpenNext (`opennextjs-cloudflare`) is different from standard Next.js builds
- It adapts Next.js for Cloudflare Workers runtime
- Requires `TURSO_AUTH_TOKEN` and `TURSO_DATABASE_URL` in `.env.production`
- Configuration in `open-next.config.ts` and `next.config.ts`
- Uses `serverExternalPackages: ['@libsql/isomorphic-ws']` in Next.js config to avoid bundling issues

### Smart Contracts

- **Deployment**: Use Hardhat Ignition for contract deployment
- **Upgrades**: UUPS proxy pattern allows upgrades via Hardhat
