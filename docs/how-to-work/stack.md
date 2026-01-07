# Technology Stack

> **Document Type**: State (keep current)
>
> Last updated: 2026-01-07

---

## Runtime & Language

| Technology | Version    | Purpose                              |
| ---------- | ---------- | ------------------------------------ |
| Node.js    | 20.x (LTS) | Runtime for both API and build tools |
| TypeScript | 5.x        | Primary language for type safety     |

---

## Frontend

| Technology   | Version | Purpose                         |
| ------------ | ------- | ------------------------------- |
| React        | 18.x    | UI library                      |
| Vite         | 5.x     | Build tool and dev server       |
| Tailwind CSS | 3.x     | Utility-first CSS framework     |
| React Router | 6.x     | Client-side routing (if needed) |

### Frontend Testing

| Library                     | Version | Purpose                     |
| --------------------------- | ------- | --------------------------- |
| Vitest                      | Latest  | Test runner                 |
| React Testing Library       | Latest  | Component testing           |
| @testing-library/user-event | Latest  | User interaction simulation |

---

## Backend

| Technology | Version | Purpose                |
| ---------- | ------- | ---------------------- |
| Express    | 4.x     | Web framework          |
| TypeScript | 5.x     | Type-safe backend code |

### Backend Testing

| Library   | Version | Purpose                                |
| --------- | ------- | -------------------------------------- |
| Vitest    | Latest  | Test runner                            |
| Supertest | Latest  | HTTP assertion library for API testing |

---

## Database

| Technology | Version | Purpose                  |
| ---------- | ------- | ------------------------ |
| PostgreSQL | 16.x    | Primary database         |
| Prisma     | Latest  | ORM and database toolkit |

---

## Authentication

| Technology   | Version | Purpose                               |
| ------------ | ------- | ------------------------------------- |
| jsonwebtoken | Latest  | JWT token generation and verification |
| bcrypt       | Latest  | Password hashing                      |

**Auth Strategy**: JWT access tokens (short-lived, stored in memory) + refresh tokens (long-lived, stored in httpOnly cookie). Refresh tokens are rotated on each use.

---

## Development Tools

| Tool       | Version | Purpose        |
| ---------- | ------- | -------------- |
| ESLint     | Latest  | Linter         |
| Prettier   | Latest  | Code formatter |
| TypeScript | 5.x     | Type checking  |

---

## Infrastructure

| Service        | Purpose                         | Notes                                        |
| -------------- | ------------------------------- | -------------------------------------------- |
| Docker         | Local database containerization | Used for local PostgreSQL via docker-compose |
| Docker Compose | Multi-container orchestration   | Manages local database setup                 |

---

## Key Technical Decisions

For detailed rationale, see `docs/how-to-work/decisions.md`.

- **React + Vite**: Fast development experience, modern tooling, excellent HMR
- **Express API**: Simple, flexible, well-documented Node.js framework
- **PostgreSQL**: Reliable, feature-rich relational database
- **Prisma**: Type-safe database access, excellent migration system, great DX
- **JWT with refresh token rotation**: Stateless auth with secure token refresh mechanism
- **Tailwind CSS**: Rapid UI development, consistent design system, small bundle size

---

## Package Management

This project uses **npm** with workspaces (or can be configured for pnpm/yarn workspaces).

```bash
# Install all dependencies
npm install

# Install in specific workspace
cd apps/api && npm install
cd apps/web && npm install
```

---

## Version Pinning Strategy

- **Major versions**: Pinned to ensure compatibility
- **Minor/patch versions**: Use `^` to allow updates (e.g., `"react": "^18.2.0"`)
- **Security updates**: Review and update regularly
