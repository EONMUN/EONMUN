# Project Constitution

## Overview

EONMUN is the official digital portfolio and e-commerce platform for the artist EONMUN. It serves as a visually immersive gallery showcasing collections and artworks, and a direct-to-consumer store for physical products. The platform is the primary hub for the artist's online presence, intended to drive engagement, sales, and audience growth before content is shared to other social media channels.

## Development Priorities

1. **UX & Visual Quality** - The platform is an artist's portfolio first. Every feature must serve the visual experience and maintain an immersive, gallery-quality aesthetic.
2. **Performance** - Fast page loads, optimized images, and strong SEO are essential for driving organic traffic and converting visitors into collectors.
3. **Code Quality** - Maintainable, well-typed TypeScript following existing project patterns. New features should be consistent with the established codebase architecture.

## Technology Stack

### Languages

- TypeScript (strict mode)

### Frameworks

- Next.js 15 (App Router)
- React 19
- Tailwind CSS

### Database

- Drizzle ORM
- Dev: Local SQLite via Docker/libSQL
- Prod: Turso (libSQL)

### Payments

- Stripe API

### Infrastructure

- Dev: Docker Compose, Nix flake dev shell
- Prod: Cloudflare Workers via OpenNext
- Image storage: Cloudflare R2

### Testing

- E2E: Playwright (Nix-managed browsers, never run `playwright install`)
- Unit: Vitest

## Quality Standards

### Code Quality

- Strict TypeScript with no `any` types unless unavoidable
- Server Actions for mutations and form handling (in `src/actions/`)
- Drizzle ORM schema definitions in `src/database/schema.*.ts`
- App Router conventions: layouts, pages, loading states
- Tailwind for styling; no CSS modules or inline styles
- Follow existing patterns in the codebase before introducing new ones

### Testing Requirements

- Playwright E2E tests for critical user paths: admin CRUD operations, public page rendering, purchase flows
- Tests should use existing fixture/seed data patterns (see `docs/conventions/test-data-patterns.md`)
- No coverage threshold enforced; focus on critical path coverage

### Security Requirements

- Admin routes protected by authentication
- Stripe handles all payment processing; no raw card data touches the server
- Environment variables for all secrets (Stripe keys, DB credentials)
- Input validation on all server actions

## Governance

### Branching Strategy

- Feature branches off `master`
- Branch naming: `feature/[short-description]` or `deepwork/spec_driven_development-[instance]-YYYYMMDD` for spec-driven work
- Pull requests required before merging to `master`

### Review Requirements

- PRs reviewed before merge
- Automated checks: `npm run lint`, `npm run typecheck`, `npm run build` must pass
- E2E tests must pass for affected areas

### Specification Maintenance

- Feature specs live in `docs/` alongside the codebase
- Specs are updated when requirements change
- The artist (EONMUN) is the primary stakeholder for all feature decisions

## Principles

1. **Artist-First Design** - Every feature decision should ask: "Does this serve the artist's vision and the viewer's experience?" The platform is a gallery, not a generic CMS.

2. **Content Hub Strategy** - EONMUN is the canonical source for all content. Blog posts, announcements, and educational content are created here first, then shared to social media to drive traffic back.

3. **Simplicity Over Flexibility** - Build what's needed now. Avoid over-engineering, excessive configuration, or premature abstraction. A simple blog post that ships is better than a complex content system that doesn't.

4. **Consistency With Existing Patterns** - New features should follow established conventions in the codebase (server actions, Drizzle schema patterns, admin UI layout). Diverge only when there's a clear reason.

5. **Visual Immersion** - Performance and aesthetics are not at odds. Optimize images, minimize layout shift, and ensure every page feels intentional and gallery-quality.
