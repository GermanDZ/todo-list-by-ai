# Conventions

> **Document Type**: State (keep current)
>
> Last updated: 2026-01-07

---

## File Structure

```
todo-list-by-ai/
├── apps/
│   ├── web/                    # React + Vite frontend
│   │   ├── src/
│   │   │   ├── components/     # React components
│   │   │   ├── hooks/          # Custom React hooks
│   │   │   ├── lib/            # Utilities and API client
│   │   │   ├── types/          # TypeScript types
│   │   │   └── App.tsx         # Root component
│   │   ├── public/             # Static assets
│   │   └── package.json
│   └── api/                    # Express backend
│       ├── src/
│       │   ├── routes/         # API route handlers
│       │   ├── middleware/     # Express middleware
│       │   ├── services/       # Business logic
│       │   ├── models/          # Prisma models (generated)
│       │   ├── types/          # TypeScript types
│       │   └── app.ts          # Express app setup
│       ├── prisma/
│       │   ├── schema.prisma  # Database schema
│       │   └── migrations/    # Migration files
│       └── package.json
├── packages/
│   └── shared/                 # Shared TypeScript types (optional)
├── infra/
│   └── docker-compose.yml      # Docker Compose for local DB
├── docs/                       # Documentation
└── package.json                # Root package.json (workspaces)
```

---

## Naming Conventions

### Files

| Type             | Convention              | Example                                   |
| ---------------- | ----------------------- | ----------------------------------------- |
| React Components | PascalCase              | `TaskItem.tsx`, `TaskForm.tsx`            |
| API Routes       | camelCase               | `authRoutes.ts`, `taskRoutes.ts`          |
| Utilities        | camelCase               | `formatDate.ts`, `apiClient.ts`           |
| Types/Interfaces | PascalCase              | `User.ts`, `Task.ts`                      |
| Tests            | Match source + `.test.` | `TaskItem.test.tsx`, `authRoutes.test.ts` |

### Code

| Type              | Convention           | Example                     |
| ----------------- | -------------------- | --------------------------- |
| Variables         | camelCase            | `userName`, `taskList`      |
| Functions/Methods | camelCase            | `getUserById`, `createTask` |
| Classes/Types     | PascalCase           | `UserService`, `TaskModel`  |
| Constants         | SCREAMING_SNAKE_CASE | `MAX_RETRIES`, `JWT_SECRET` |
| Enums             | PascalCase           | `TaskStatus`, `UserRole`    |

---

## Code Style

### General Principles

- Prefer clarity over cleverness
- Keep functions small and focused (single responsibility)
- Use meaningful names that describe intent
- Write self-documenting code; add comments for _why_, not _what_
- Use TypeScript for type safety

### TypeScript/JavaScript

- Prefer `const` over `let` (avoid `var`)
- Use explicit return types on public functions
- Prefer named exports over default exports
- Use interfaces for object shapes, types for unions/intersections
- Avoid `any`; use `unknown` if type is truly unknown

**Example**:

```typescript
// Good
export interface Task {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
}

export function createTask(title: string): Promise<Task> {
  // Implementation
}

// Bad
export default function createTask(title: any): any {
  // Implementation
}
```

### React Components

- Use functional components with hooks
- Extract custom hooks for reusable logic
- Use TypeScript for component props
- Keep components small and focused

**Example**:

```typescript
// Good
interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
}

export function TaskItem({ task, onToggle }: TaskItemProps) {
  return (
    <div>
      <input
        type="checkbox"
        checked={task.completed}
        onChange={() => onToggle(task.id)}
      />
      <span>{task.title}</span>
    </div>
  );
}

// Bad
export function TaskItem(props: any) {
  return <div>{props.task.title}</div>;
}
```

### Express Routes

- Use async/await for async operations
- Handle errors with try/catch or error middleware
- Validate input before processing
- Return consistent response formats

**Example**:

```typescript
// Good
router.post('/tasks', authenticate, async (req, res, next) => {
  try {
    const { title } = req.body;

    if (!title || title.trim().length === 0) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const task = await taskService.createTask(req.user.id, title);
    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
});

// Bad
router.post('/tasks', (req, res) => {
  taskService.createTask(req.body.title).then((task) => {
    res.json(task);
  });
});
```

---

## Imports / Dependencies

Import ordering:

1. **Standard library / built-ins**
2. **External dependencies / third-party**
3. **Internal / project modules**
4. **Relative imports**

**Example**:

```typescript
// 1. Standard library
import { readFile } from 'fs';
import { join } from 'path';

// 2. External dependencies
import express from 'express';
import { z } from 'zod';

// 3. Internal modules
import { TaskService } from '../services/TaskService';
import { authenticate } from '../middleware/auth';

// 4. Relative imports
import { TaskItem } from './TaskItem';
```

---

## Git Conventions

### Branches

```
feature/issue-{number}-{short-description}
fix/issue-{number}-{short-description}
refactor/{description}
docs/{description}
```

**Examples**:

- `feature/issue-1-user-authentication`
- `fix/issue-5-task-deletion-bug`
- `refactor/extract-api-client`
- `docs/update-readme`

### Commits

```
type(scope): description

Types: feat, fix, refactor, test, docs, chore
```

**Examples**:

- `feat(auth): add user registration endpoint`
- `fix(api): handle expired token refresh`
- `refactor(web): extract task form component`
- `test(api): add integration tests for task CRUD`
- `docs(readme): update local development setup`

### Commit Sequence

When implementing a feature, follow this order:

1. `refactor`: Prepare codebase for changes
2. `test`: Add tests for new functionality
3. `feat`/`fix`: Implement the actual change
4. `docs`: Update documentation

Each commit must pass all tests.

### Pull Requests

- **Title**: `[TYPE] Brief description (#issue)`
- **Description**: Link to the issue/task being solved, include brief description of approach
- **Size**: Keep PRs small and focused (<400 lines changed)
- **Tests**: All tests must pass

**Example**:

```
[FEAT] User authentication system (#1)

Implements user registration and login with JWT tokens.

- POST /api/auth/register - Create new user account
- POST /api/auth/login - Authenticate and receive tokens
- POST /api/auth/refresh - Refresh access token
- JWT middleware for protected routes

Closes #1
```

---

## Testing

### What to Test

- Business logic and data transformations
- API endpoints (request/response, error handling)
- Authentication flows
- Task CRUD operations
- Edge cases and error handling
- User interactions (form submissions, button clicks)

### What to Skip

- Third-party library internals
- Trivial getters/setters
- Implementation details (prefer testing behavior)

### Test Naming

Use descriptive names that explain the scenario:

**Good**:

- `should_return_401_when_access_token_is_expired`
- `should_create_task_when_authenticated_user_provides_valid_title`
- `should_display_strike_through_when_task_is_completed`

**Bad**:

- `test_auth`
- `test_task_creation`
- `test_completion`

See [Testing](../testing.md) for detailed testing conventions.

---

## Documentation

### Code Comments

- Explain _why_, not _what_
- Document non-obvious behavior
- Use JSDoc for public functions

**Example**:

```typescript
/**
 * Creates a new task for the authenticated user.
 *
 * @param userId - The ID of the user creating the task
 * @param title - The task title (must be non-empty)
 * @returns The created task with generated ID and timestamps
 * @throws {ValidationError} If title is empty or invalid
 */
export async function createTask(userId: string, title: string): Promise<Task> {
  // Implementation
}
```

### Docs Folder

- Keep docs up to date when making changes
- Reference docs in PR descriptions when relevant
- Update `docs/how-to-work/roadmap.md` when completing tasks

---

## API Conventions

### Endpoint Naming

- Use RESTful conventions: `GET /api/tasks`, `POST /api/tasks`, `PATCH /api/tasks/:id`, `DELETE /api/tasks/:id`
- Use plural nouns for resources
- Use kebab-case for multi-word endpoints: `/api/auth/refresh-token`

### Response Formats

- Success: `200 OK` or `201 Created` with JSON body
- Error: `4xx` or `5xx` with error object: `{ error: "Error message" }`
- Consistent structure across endpoints

**Example**:

```typescript
// Success
{
  "id": "123",
  "title": "Task title",
  "completed": false,
  "createdAt": "2026-01-07T10:00:00Z"
}

// Error
{
  "error": "Task not found"
}
```

---

## References

- [Stack](stack.md) - Technology choices
- [Architecture](architecture.md) - System design
- [Testing](../testing.md) - Testing strategy
- [Roadmap](roadmap.md) - Current tasks
