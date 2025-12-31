# AGENTS.md

This file provides context and guidance for developers and agents working on the **EONMUN** project.

## Project Overview

**EONMUN** is the official digital portfolio and e-commerce platform for the artist **EONMUN**.
The application serves two primary purposes:
1.  **Portfolio**: A visually immersive gallery to showcase the artist's collections and individual artworks.
2.  **Store**: A direct-to-consumer store allowing collectors to purchase physical products and artworks.

## Core Features

### 🎨 Portfolio & Gallery
-   **Artworks**: comprehensive listing of artworks (`/artworks`) with high-quality imagery and details.
-   **Collections**: Curated groups of works (`/collections`) representing specific themes or periods.
-   **Artist Info**: Biography and contact information (`/about`, `/contact`).

### 🛍️ Store & Commerce
-   **E-commerce**: Integrated shopping experience (`/store`) for physical goods (prints, merchandise, originals).
-   **Payments**: Secure payment processing powered by **Stripe**.
-   **Checkout**: Seamless purchase flow (`/purchase`).

### 🛠️ Admin Dashboard
The admin area (`/admin`) is a secure interface for content management.

#### Artworks Management (`/admin/artworks`)
- **CRUD Operations**: Manage artwork metadata (Title, Year, Dimensions).
- **Store Integration**: Setting a price automatically creates/updates an associated `product` entry.
- **Image Management**: Handle uploads and designate "default" cover images.
- **Collection Assignment**: Assign artworks to multiple collections.

#### Collections Management (`/admin/collections`)
- **Curation**: Group artworks into themed collections.
- **Cover Images**: Designate a specific artwork as the collection's "Default Artwork" to serve as its cover.
- **Relationship**: M:N relationship between Artworks and Collections managed via `artworks_to_collections` junction table.

#### Order Management
- View and process customer orders from the store.

## Technical Architecture

### Stack
-   **Framework**: Next.js 15 (App Router)
-   **UI**: React 19, Tailwind CSS
-   **Database**: Drizzle ORM
    -   *Dev*: Local SQLite (via Docker/libSQL)
    -   *Prod*: Turso (libSQL)
-   **Payments**: Stripe API
-   **Infrastructure**: Docker Compose (Dev), Cloudflare Workers (Prod via OpenNext)
-   **Testing**: Playwright (E2E), Vitest (Unit)

### Key Directories
-   `src/app`: Application routes (Admin, Store, Portfolio).
-   `src/database`: Drizzle schema definitions (`schema.artworks.ts`, etc.).
-   `src/actions`: Server Actions for business logic (handling form submissions, database mutations).
-   `drizzle`: Database migrations.

## Developer Workflow

### Quick Start
```bash
make init          # Initialize project and start services
make up            # Start all services with Docker Compose
npm run dev        # Start local development server
```

### Common Commands
```bash
npm run build      # Production build
npm run lint       # Run linter
npm run typecheck  # Run TypeScript check
npm run db:studio  # Open Database GUI
```

### Testing
```bash
make e2e           # Run Playwright end-to-end tests
npm run test       # Run Vitest unit tests
```

### Environment
-   Configuration is managed via `.env`.
-   **Ports**: Check `.env` for `WEB_PORT` (Frontend) and `DB_PORT` (Database).
-   **Stripe**: Requires `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.

---

## 🔗 Footnote: Web3 & NFT Features
*Note: These features are currently secondary to the main Portfolio/Store functionality.*

The project includes Web3 capabilities for an NFT platform (`/nfts`).
-   **Blockchain**: Ethereum/EVM compatible smart contracts (Hardhat).
-   **Integration**: Wagmi & Viem for frontend interaction.
-   **Contracts**: Upgradeable ERC721 contracts located in `hardhat/`.