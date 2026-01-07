# Changelog

> **Document Type**: Incremental (append-only)
>
> All notable changes to this project will be documented in this file.
>
> Format based on [Keep a Changelog](https://keepachangelog.com/).

---

## [Unreleased]

### Added

#### Authentication System (Sprint 1)

**Backend:**
- User registration endpoint (`POST /api/auth/register`) with email and password validation
- User login endpoint (`POST /api/auth/login`) with credential verification
- Refresh token endpoint (`POST /api/auth/refresh`) with token rotation
- Logout endpoint (`POST /api/auth/logout`) for token invalidation
- JWT authentication middleware for protecting routes
- Password hashing with bcrypt (10 salt rounds)
- JWT token generation and validation utilities
- Refresh token service for database token management
- Cookie-based refresh token storage (httpOnly, secure)

**Frontend:**
- Registration form component with email and password validation
- Login form component with error handling
- Auth page layout with login/register toggle
- API client with automatic token management and refresh
- useAuth hook for authentication state management
- Protected route component for route guarding
- React Router integration with authentication flow

**Testing:**
- Integration tests for all authentication endpoints
- Test coverage for registration, login, refresh, and logout flows
- Error scenario testing (invalid credentials, expired tokens)

### Changed

- Updated app routing to include authentication pages
- Added cookie-parser middleware for refresh token handling

### Fixed

### Removed

---

<!--
## [X.Y.Z] - YYYY-MM-DD

### Added
- New features

### Changed
- Changes in existing functionality

### Deprecated
- Soon-to-be removed features

### Removed
- Removed features

### Fixed
- Bug fixes

### Security
- Vulnerability fixes
-->
