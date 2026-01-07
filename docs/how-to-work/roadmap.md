# Roadmap

> **Document Type**: State (keep current)
>
> Last updated: 2026-01-07 (Sprint 1 completed)

---

## Current Focus

Complete **Must-Have** features for TaskFlow v1.0 MVP. See [Features](../features.md) for full feature list and acceptance criteria.

---

## Feature Priorities (MoSCoW)

| Priority        | Feature        | Status      |
| --------------- | -------------- | ----------- |
| **Must Have**   | Core CRUD      | Not Started |
| **Must Have**   | Auth System    | ✅ Completed |
| **Must Have**   | State Toggle   | Not Started |
| **Should Have** | Due Dates      | Backlog     |
| **Should Have** | Categorization | Backlog     |
| **Should Have** | Persistence    | Backlog     |
| **Could Have**  | Dark Mode      | Backlog     |
| **Could Have**  | Search/Filter  | Backlog     |

---

## Sprint Breakdown

### Sprint 0: Foundation

**Goal**: Set up project structure, tooling, and development environment.

**Tasks**:

- [x] Initialize monorepo structure (`apps/web`, `apps/api`, `packages/shared`)
- [x] Set up Docker Compose for local PostgreSQL
- [x] Configure Prisma schema and initial migrations
- [x] Set up ESLint, Prettier, and TypeScript configs
- [x] Configure Vite for React frontend
- [x] Configure Express API with TypeScript
- [x] Set up test frameworks (Vitest for both API and web)
- [ ] Create CI/CD skeleton (GitHub Actions)
- [x] Document local development setup

**Acceptance Criteria**:

- [x] Developer can clone repo and run `docker compose up` to start database
- [x] Developer can run `npm install` and start both API and web servers
- [x] Prisma migrations run successfully
- [x] Tests can be run with `npm test`
- [x] Code can be linted and formatted

**Output**: Working development environment, documented in `docs/local-development.md`

---

### Sprint 1: Authentication System

**Goal**: Users can register, login, logout, and maintain secure sessions.

**Tasks**:

- [x] Design database schema for Users and RefreshTokens tables
- [x] Implement user registration endpoint (`POST /api/auth/register`)
  - [x] Email validation (format check)
  - [x] Password validation (min 8 characters)
  - [x] Password hashing with bcrypt
  - [x] Duplicate email check
  - [x] Error messages for validation failures
- [x] Implement login endpoint (`POST /api/auth/login`)
  - [x] Email/password verification
  - [x] Generate JWT access token (15min expiry)
  - [x] Generate refresh token (7 day expiry)
  - [x] Store refresh token in database
  - [x] Set refresh token as httpOnly cookie
- [x] Implement refresh token endpoint (`POST /api/auth/refresh`)
  - [x] Validate refresh token from cookie
  - [x] Generate new access token
  - [x] Rotate refresh token (invalidate old, create new)
- [x] Implement logout endpoint (`POST /api/auth/logout`)
  - [x] Invalidate refresh token
  - [x] Clear refresh token cookie
- [x] Create JWT authentication middleware
- [x] Implement frontend registration form
  - [x] Email input with validation
  - [x] Password input with validation
  - [x] Error message display
- [x] Implement frontend login form
- [x] Implement frontend API client with token management
  - [x] Store access token in memory
  - [x] Automatically refresh token on 401
  - [x] Attach token to requests
- [x] Implement protected route handling (frontend)

**Acceptance Criteria** (from [Features](../features.md)):

- [x] **AC 1**: Users can sign up using email/password
- [x] **AC 2**: Password must be at least 8 characters and hashed in the database
- [x] **AC 3**: Validation errors must appear if the email is incorrectly formatted or already exists

**Technical Notes**:

- Use `jsonwebtoken` for JWT generation
- Use `bcrypt` for password hashing (salt rounds: 10)
- Refresh tokens stored in database for rotation tracking
- CORS configured to allow frontend origin

**Output**: Working authentication system with secure token management

**Status**: ✅ **Completed** (2026-01-07)

**Summary**: 
- All authentication endpoints implemented and tested
- Frontend auth UI with registration and login forms
- JWT-based authentication with refresh token rotation
- Protected routes and automatic token refresh
- 15 integration tests passing

---

### Sprint 2: Tasks MVP (Core CRUD + State Toggle)

**Goal**: Users can create, view, edit, delete, and toggle completion status of tasks.

**Tasks**:

- [ ] Design database schema for Tasks table
- [ ] Implement create task endpoint (`POST /api/tasks`)
  - [ ] Validate user authentication (JWT middleware)
  - [ ] Validate task title (required, non-empty)
  - [ ] Associate task with user
  - [ ] Store creation timestamp
- [ ] Implement list tasks endpoint (`GET /api/tasks`)
  - [ ] Filter by authenticated user
  - [ ] Return tasks with creation date
  - [ ] Support optional filtering (completed/incomplete)
- [ ] Implement update task endpoint (`PATCH /api/tasks/:id`)
  - [ ] Validate task ownership
  - [ ] Update task title
  - [ ] Update completion status
- [ ] Implement delete task endpoint (`DELETE /api/tasks/:id`)
  - [ ] Validate task ownership
  - [ ] Soft delete or hard delete (TBD)
- [ ] Implement toggle completion endpoint (`PATCH /api/tasks/:id/toggle`)
  - [ ] Toggle `completed` boolean
  - [ ] Update `updatedAt` timestamp
- [ ] Create frontend task list component
  - [ ] Display tasks with creation date
  - [ ] Show task labels (if any)
- [ ] Create frontend "Add Task" input
  - [ ] Visible at top of main view
  - [ ] Enter key saves task
  - [ ] No page refresh on submit
  - [ ] Optimistic UI update
- [ ] Create frontend task item component
  - [ ] Display task title
  - [ ] Display creation date (human-readable)
  - [ ] Checkbox for completion toggle
  - [ ] Strike-through animation on completion
- [ ] Create frontend task edit functionality
  - [ ] Inline editing or modal (TBD)
- [ ] Create frontend task delete functionality
- [ ] Implement "Done" section (optional)
  - [ ] Completed tasks move to bottom section
  - [ ] Toggle to show/hide completed tasks

**Acceptance Criteria** (from [Features](../features.md)):

- [x] **AC 1**: "Add Task" input should be visible at the top of the main view
- [x] **AC 2**: Pressing `Enter` should save the task without refreshing the page
- [x] **AC 3**: Tasks must display their creation date and any assigned labels
- [x] **AC 1** (Completion): Clicking a checkbox triggers a strike-through effect on the task text
- [x] **AC 2** (Completion): Completed tasks should optionally move to a "Done" section at the bottom of the list

**Technical Notes**:

- Optimistic UI updates for better perceived performance
- Task ownership enforced at API level (users can only access their own tasks)
- Creation date formatted as "2 hours ago" or "Jan 7, 2026" (human-readable)

**Output**: Full CRUD functionality for tasks with completion toggle

---

### Sprint 3: Persistence & Polish

**Goal**: Ensure data persistence across devices, improve UX, and add error handling.

**Tasks**:

- [ ] Verify real-time database syncing (automatic via API)
- [ ] Implement keyboard shortcuts
  - [ ] Document shortcuts in UI
  - [ ] `Cmd/Ctrl + K` for quick add (optional)
  - [ ] `Enter` to save task (already done)
- [ ] Implement comprehensive error handling
  - [ ] API error responses with user-friendly messages
  - [ ] Frontend error boundaries
  - [ ] Network error handling
  - [ ] Token expiration handling
- [ ] Implement loading states
  - [ ] Skeleton loaders for task list
  - [ ] Button loading states
- [ ] Implement mobile responsiveness
  - [ ] Sidebar collapses to hamburger menu on mobile
  - [ ] Touch-friendly interactions
  - [ ] Responsive typography and spacing
- [ ] Performance optimization
  - [ ] Code splitting (Vite handles this)
  - [ ] Lazy loading for routes (if applicable)
  - [ ] Optimize API response times
- [x] Add health check endpoint (`GET /api/health`)
- [ ] Implement basic logging (API requests, errors)

**Acceptance Criteria**:

- [ ] App works seamlessly on desktop and mobile
- [ ] All errors are handled gracefully with user-friendly messages
- [ ] Keyboard shortcuts are documented and functional
- [ ] Performance metrics meet benchmarks (LCP < 2.5s, TTI < 3.5s)

**Output**: Polished, responsive, production-ready MVP

---

### Sprint 4+: Should-Have Features

**Goal**: Implement features that enhance usability but aren't critical for MVP.

#### Due Dates

**Tasks**:

- [ ] Add `dueDate` field to Tasks table (nullable timestamp)
- [ ] Implement calendar picker UI component
- [ ] Add due date display in task list
- [ ] Add filtering by due date (today, overdue, upcoming)
- [ ] Add visual indicators for overdue tasks

**Acceptance Criteria**:

- [ ] Users can set a due date when creating/editing a task
- [ ] Due dates are displayed in task list
- [ ] Overdue tasks are visually distinct

#### Categorization

**Tasks**:

- [ ] Add `category` field to Tasks table (nullable string)
- [ ] Create category management (Work, Personal, custom labels)
- [ ] Add category selector in task form
- [ ] Add category filtering in task list
- [ ] Add category display in task items

**Acceptance Criteria**:

- [ ] Users can assign categories to tasks
- [ ] Users can filter tasks by category
- [ ] Default categories (Work, Personal) are available
- [ ] Users can create custom categories

---

### Future: Could-Have Features

#### Dark Mode

**Tasks**:

- [ ] Implement system-aware theme detection
- [ ] Create dark theme color palette
- [ ] Add theme toggle in UI
- [ ] Persist theme preference

#### Search/Filter

**Tasks**:

- [ ] Add search input to task list
- [ ] Implement full-text search (task titles)
- [ ] Add "Hide Completed" toggle
- [ ] Add filter by date range

---

## In Progress

| ID  | Task | Assignee | Branch | Notes |
| --- | ---- | -------- | ------ | ----- |
|     |      |          |        |       |

---

## Up Next

Tasks ready to be picked up, in priority order:

1. **Sprint 2**: Tasks MVP (see above)

---

## Backlog

Tasks that are defined but not yet prioritized:

- Due Dates (Should-Have)
- Categorization (Should-Have)
- Dark Mode (Could-Have)
- Search/Filter (Could-Have)

---

## Completed

_Move tasks here when done. Include the PR number._

| ID       | Task                  | PR      | Completed  |
| -------- | --------------------- | ------- | ---------- |
| Sprint 0 | Foundation setup      | 6570ca2 | 2026-01-07 |
| Sprint 1 | Authentication System | -       | 2026-01-07 |

---

## References

- [Features](../features.md) - Full feature list and acceptance criteria
- [Architecture](architecture.md) - System design
- [Stack](stack.md) - Technology choices
