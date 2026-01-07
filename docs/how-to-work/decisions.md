# Architectural Decision Records

> **Document Type**: Incremental (append-only)
>
> New decisions are added at the bottom. Past decisions are never modified—add a new decision that supersedes if needed.

---

## ADR-001: Use ADRs for Architectural Decisions

**Date**: YYYY-MM-DD

**Status**: Accepted

### Context

We need a way to document architectural decisions so that future team members (and AI agents) understand why the system is built the way it is.

### Decision

We will use Architectural Decision Records (ADRs) stored in this file. Each decision is numbered sequentially and includes context, the decision made, and consequences.

### Consequences

- Historical decisions are preserved and searchable
- New team members can understand the evolution of the architecture
- Decisions cannot be silently changed—superseding requires a new ADR

---

## ADR-002: React + Vite for Frontend

**Date**: 2026-01-07

**Status**: Accepted

### Context

TaskFlow needs a fast, modern frontend framework that supports rapid development and excellent developer experience. The PRD emphasizes speed and keyboard-centric navigation, requiring a framework with excellent performance and hot module replacement.

### Decision

We will use **React 18** with **Vite 5** as the build tool and dev server. We will use **Tailwind CSS** for styling to enable rapid UI development with a consistent design system.

### Consequences

**Positive**:

- Fast development experience with Vite's HMR
- Modern React features (hooks, concurrent rendering)
- Small bundle size with Vite's optimized builds
- Rapid UI development with Tailwind CSS
- Excellent TypeScript support

**Negative**:

- No SSR out of the box (not needed for MVP)
- Requires separate API server (acceptable for architecture)

---

## ADR-003: Express API Backend

**Date**: 2026-01-07

**Status**: Accepted

### Context

TaskFlow needs a simple, flexible backend API that can handle authentication, task CRUD operations, and database interactions. The backend should be easy to understand and maintain, with good TypeScript support.

### Decision

We will use **Express 4.x** with **TypeScript** for the backend API. Express provides a simple, well-documented framework that's easy to extend and maintain.

### Consequences

**Positive**:

- Simple, flexible framework
- Large ecosystem of middleware
- Excellent TypeScript support
- Easy to test with Supertest
- Well-documented

**Negative**:

- Less opinionated than frameworks like NestJS (requires more setup)
- Manual middleware configuration (acceptable for MVP scope)

---

## ADR-004: JWT with Refresh Token Rotation

**Date**: 2026-01-07

**Status**: Accepted

### Context

TaskFlow needs secure authentication that works across devices without server-side session storage. The authentication system must be stateless (for scalability) but also secure against token theft.

### Decision

We will use **JWT access tokens** (short-lived, ~15 minutes) stored in memory on the frontend, combined with **refresh tokens** (long-lived, ~7 days) stored in httpOnly cookies. Refresh tokens will be **rotated** on each use: when a refresh token is used, a new refresh token is issued and the old one is invalidated.

### Consequences

**Positive**:

- Stateless authentication (no server-side session storage)
- Access tokens can't be stolen via XSS (stored in memory, not localStorage)
- Refresh tokens can't be accessed via JavaScript (httpOnly cookie)
- Token rotation limits impact of token theft
- Works across devices and browsers

**Negative**:

- More complex than simple session-based auth
- Requires database storage for refresh token rotation tracking
- Need to handle token refresh flow in frontend

---

## ADR-005: Prisma ORM

**Date**: 2026-01-07

**Status**: Accepted

### Context

TaskFlow needs type-safe database access with excellent developer experience. Database migrations should be easy to manage, and the ORM should provide strong TypeScript support.

### Decision

We will use **Prisma** as the ORM for PostgreSQL. Prisma provides type-safe database access, excellent migration system, and Prisma Studio for database management.

### Consequences

**Positive**:

- Type-safe database queries (TypeScript autocomplete)
- Excellent migration system (Prisma Migrate)
- Prisma Studio for database browsing
- Great developer experience
- Prevents SQL injection (parameterized queries)

**Negative**:

- Learning curve for Prisma schema syntax
- Less flexible than raw SQL (acceptable for MVP)
- Requires Prisma Client generation step

---

## Template for New Decisions

<!--
Copy this template when adding a new decision:

## ADR-XXX: Title

**Date**: YYYY-MM-DD

**Status**: Proposed | Accepted | Superseded by ADR-XXX | Deprecated

### Context

What is the issue that we're seeing that is motivating this decision?

### Decision

What is the change that we're proposing and/or doing?

### Consequences

What becomes easier or more difficult because of this decision?
-->
