# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15 application with tracking and analytics capabilities, using TypeScript, Tailwind CSS v4, and shadcn/ui components. The project implements Google Tag Manager (GTM) integration with consent management, PostHog analytics, and Redis session management.

## Development Commands

```bash
# Development
bun dev                 # Start dev server with Turbopack at localhost:3000

# Build & Production
bun run build          # Build for production
bun run start          # Start production server

# Code Quality
bun run lint           # Run ESLint
bun run typecheck      # Type checking (bunx tsc --noEmit --incremental false)
```

## Architecture

### Directory Structure
- `/src/app/` - Next.js App Router pages and layouts
- `/src/components/` - React components including shadcn/ui components
- `/src/services/` - Service integrations (GTM, PostHog, Meta, Redis)
- `/src/lib/` - Utilities, environment config, and Redis client
- `/src/middleware.ts` - Next.js middleware
- `/docs/` - Extensive documentation for architecture and implementations

### Key Technologies
- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS v4 with CSS variables
- **UI Components**: shadcn/ui (configured in components.json)
- **Analytics**: Google Tag Manager, PostHog, Meta Pixel
- **Session Management**: Redis via Upstash
- **Environment**: T3 Env for type-safe environment variables
- **Package Manager**: Bun

### Environment Configuration
The project uses T3 Env for type-safe environment variables:
- Client env: `/src/lib/env.client.ts` - Public environment variables
- Server env: `/src/lib/env.server.ts` - Server-only environment variables

Required environment variables:
- `NEXT_PUBLIC_GTM_ID` - Google Tag Manager ID
- `NEXT_PUBLIC_POSTHOG_KEY` - PostHog API key
- `KV_REST_API_URL` - Upstash Redis REST API URL
- `KV_REST_API_TOKEN` - Upstash Redis REST API token
- `DATABASE_URL` - Database connection string
- `META_ACCESS_TOKEN` - Meta API access token
- `META_PIXEL_ID` - Meta Pixel ID

### Important Patterns
- Path aliases use `@/` prefix mapped to `./src/`
- Components follow shadcn/ui patterns with separate UI primitives
- Service files handle third-party integrations
- Consent management implemented via GTM with default denied state
- TypeScript strict mode enabled with some ESLint rules disabled