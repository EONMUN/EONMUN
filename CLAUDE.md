# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

EONMUN is a full-stack Web3 application for an art NFT platform featuring:
- **Frontend**: Next.js React app with Web3 integration
- **Backend**: Strapi CMS for content management
- **Blockchain**: Solidity smart contracts for NFT functionality
- **Infrastructure**: Docker Compose for development

## Architecture

### Multi-Service Architecture
- `web/` - Next.js frontend (port 3002 in dev)
- `strapi/` - Strapi CMS backend (port 1337 in dev) 
- `hardhat/` - Ethereum smart contracts and tooling
- `docker-compose.yaml` - Orchestrates PostgreSQL database and services

### Key Technologies
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS, Wagmi (Web3), PostHog analytics
- **Backend**: Strapi 5, PostgreSQL, Node.js
- **Blockchain**: Hardhat, OpenZeppelin upgradeable contracts, Viem
- **Deployment**: Cloudflare (OpenNext), Docker

## Development Commands

### Initial Setup
```bash
make init          # Initialize project, create admin user, start services
```

### Service Management
```bash
make up            # Start all services with Docker Compose
make down          # Stop all services
make build         # Build all Docker services
make destroy       # Clean all services and volumes
```

### Individual Services

#### Web (Next.js)
```bash
cd web/
npm run dev        # Development server with Turbopack
npm run build      # Production build
npm run lint       # ESLint
npm run deploy     # Deploy to Cloudflare
npm run wagmi      # Generate Web3 types from contracts
```

#### Strapi CMS
```bash
cd strapi/
npm run dev        # Development server
npm run build      # Production build
npm run seed:example  # Seed database with example data
```

#### Smart Contracts
```bash
cd hardhat/
npm test           # Run Hardhat tests
```

### Database
```bash
make seed          # Seed Strapi database
make sync          # Sync data from production using strapi transfer
make sync-fresh    # Fresh sync (clear DB first, then sync from production)
make sync-remote   # Direct transfer from production to local
make dbshell       # Open PostgreSQL shell
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

## Content Management

Strapi manages:
- Articles and blog content
- Artwork metadata and images
- Artist/author information
- Collections and categories
- SEO and global site data

Content types are defined in `strapi/src/api/*/content-types/*/schema.json`

## Environment Configuration

Required environment files:
- `web/.env` - Frontend configuration (copy from `.env.example`)
- `strapi/.env` - Backend configuration (copy from `.env.example`)

For production data sync, add to `strapi/.env`:
- `PROD_STRAPI_URL` - Production Strapi URL
- `STRAPI_TRANSFER_TOKEN` - Transfer token for data sync

## Development Workflow

1. Run `make init` for first-time setup
2. Use `make up` to start all services
3. Frontend available at `http://localhost:3002`
4. Strapi admin at `http://localhost:1337/admin`
5. Use `make sync` to sync production data or `make seed` for example content

## Testing

- Smart contracts: `cd hardhat && npm test`
- Frontend linting: `cd web && npm run lint`
- No comprehensive test suite currently configured

## Deployment

- **Frontend**: Cloudflare via OpenNext (`npm run deploy` in web/)
- **Backend**: Strapi deployment (`npm run deploy` in strapi/)
- **Contracts**: Use Hardhat Ignition for deployment