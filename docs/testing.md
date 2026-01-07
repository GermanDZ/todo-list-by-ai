# Testing

> Testing strategy, conventions, and how to run tests for TaskFlow.

---

## Quick Reference

```bash
# Run all tests (from project root)
npm test

# Run API tests only
cd apps/api
npm test

# Run web tests only
cd apps/web
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run a specific test file
npm test -- path/to/test/file.test.ts
```

---

## Testing Strategy

### Test Types

| Type | Purpose | Location | Framework |
|------|---------|----------|-----------|
| Unit | Test individual functions/components in isolation | `apps/*/src/**/*.test.ts` | Vitest |
| Integration | Test API endpoints with database | `apps/api/tests/integration/` | Vitest + Supertest |
| Component | Test React components | `apps/web/src/**/*.test.tsx` | Vitest + React Testing Library |

### What to Test

**Always Test**:
- Business logic and data transformations
- API endpoints (request/response, error handling)
- Authentication flows (login, register, token refresh)
- Task CRUD operations
- Edge cases and error handling
- User interactions (form submissions, button clicks)

**Consider Testing**:
- Component rendering
- API contracts (request/response formats)
- Database queries (via integration tests)

**Usually Skip**:
- Third-party library internals
- Trivial getters/setters
- Implementation details (prefer testing behavior)

---

## Writing Tests

### File Naming

```
[name].test.ts        # Unit tests (API)
[name].test.tsx       # Component tests (Web)
[name].spec.ts       # Integration tests
```

### Test Structure

**API Tests (Vitest + Supertest)**:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app';

describe('POST /api/tasks', () => {
  beforeEach(async () => {
    // Setup: clear database, create test user, etc.
  });

  it('should create a task when authenticated', async () => {
    // Arrange
    const token = 'valid-jwt-token';
    const taskData = { title: 'Test task' };

    // Act
    const response = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send(taskData);

    // Assert
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.title).toBe('Test task');
  });

  it('should return 401 when not authenticated', async () => {
    // Act
    const response = await request(app)
      .post('/api/tasks')
      .send({ title: 'Test task' });

    // Assert
    expect(response.status).toBe(401);
  });
});
```

**Component Tests (Vitest + React Testing Library)**:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskItem } from './TaskItem';

describe('TaskItem', () => {
  it('should display task title', () => {
    // Arrange
    const task = { id: '1', title: 'Test task', completed: false };

    // Act
    render(<TaskItem task={task} />);

    // Assert
    expect(screen.getByText('Test task')).toBeInTheDocument();
  });

  it('should toggle completion when checkbox is clicked', async () => {
    // Arrange
    const task = { id: '1', title: 'Test task', completed: false };
    const onToggle = vi.fn();

    // Act
    render(<TaskItem task={task} onToggle={onToggle} />);
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    // Assert
    expect(onToggle).toHaveBeenCalledWith('1');
  });
});
```

### Naming Conventions

Use descriptive names that explain the scenario:

**Good**:
- `should_return_401_when_access_token_is_expired`
- `should_create_task_when_authenticated_user_provides_valid_title`
- `should_display_strike_through_when_task_is_completed`

**Bad**:
- `test_auth`
- `test_task_creation`
- `test_completion`

---

## Test Data

### Fixtures

Create reusable test data in `apps/*/tests/fixtures/`:

```typescript
// apps/api/tests/fixtures/users.ts
export const testUser = {
  email: 'test@example.com',
  password: 'password123',
};

export const createTestUser = async () => {
  // Helper to create user in test database
};
```

### Factories

Use factories to generate test data:

```typescript
// apps/api/tests/factories/taskFactory.ts
import { faker } from '@faker-js/faker';

export const createTaskData = (overrides = {}) => ({
  title: faker.lorem.sentence(),
  completed: false,
  ...overrides,
});
```

### Mocking

**API Tests**:
- Mock external services (email, third-party APIs)
- Use test database (separate from development)
- Mock JWT verification for unit tests (use real JWT for integration tests)

**Component Tests**:
- Mock API calls (use MSW or fetch mock)
- Mock authentication context
- Mock router (if using React Router)

---

## Testing Must-Have Features

### Authentication

**What to Test**:
- [ ] User registration with valid email/password
- [ ] Registration fails with invalid email format
- [ ] Registration fails with password < 8 characters
- [ ] Registration fails with duplicate email
- [ ] Login with valid credentials returns tokens
- [ ] Login with invalid credentials returns 401
- [ ] Refresh token endpoint rotates tokens
- [ ] Refresh token endpoint invalidates old token
- [ ] Logout invalidates refresh token
- [ ] Protected routes require valid JWT
- [ ] Expired access token triggers refresh flow

**Example Test**:

```typescript
describe('POST /api/auth/register', () => {
  it('should create user with valid email and password', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ email: 'new@example.com', password: 'password123' });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('user');
    expect(response.body.user.email).toBe('new@example.com');
  });

  it('should return 400 when password is less than 8 characters', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'short' });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('password');
  });
});
```

### Task CRUD

**What to Test**:
- [ ] Create task with valid title (authenticated)
- [ ] Create task fails when not authenticated
- [ ] Create task fails with empty title
- [ ] List tasks returns only user's tasks
- [ ] Update task updates title
- [ ] Update task fails when task doesn't belong to user
- [ ] Delete task removes task from database
- [ ] Delete task fails when task doesn't belong to user
- [ ] Toggle completion updates task status
- [ ] Task creation date is set automatically

**Example Test**:

```typescript
describe('POST /api/tasks', () => {
  it('should create task when Enter key is pressed', async () => {
    // This tests the frontend behavior
    const { getByPlaceholderText } = render(<TaskForm />);
    const input = getByPlaceholderText('Add task...');
    
    fireEvent.change(input, { target: { value: 'New task' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(screen.getByText('New task')).toBeInTheDocument();
    });
  });
});
```

### Task Completion

**What to Test**:
- [ ] Checkbox click toggles completion status
- [ ] Completed tasks show strike-through styling
- [ ] Completed tasks move to "Done" section (if implemented)
- [ ] Toggle completion updates database
- [ ] Toggle completion is optimistic (UI updates immediately)

---

## Coverage

### Requirements

- **Minimum coverage**: 80% for business logic
- **New code**: Must include tests
- **Critical paths**: 100% coverage (auth, task CRUD)

### Viewing Coverage

```bash
# Generate coverage report
npm test -- --coverage

# Open HTML report (location shown in terminal)
open coverage/index.html
```

### Coverage Reports

Coverage reports are generated in `coverage/` directory:
- `coverage/lcov-report/index.html` - HTML report
- `coverage/lcov.info` - LCOV format (for CI)

---

## CI Integration

Tests run automatically on:
- Pull request creation
- Push to `main` / `develop`

See `.github/workflows/ci.yml` for CI configuration (to be created in Sprint 0).

---

## Troubleshooting

### Tests are slow

- Check for unnecessary database calls (use test database, not dev)
- Use mocks for external services
- Run specific test files instead of full suite: `npm test -- path/to/file.test.ts`

### Tests are flaky

- Avoid time-dependent assertions (use fixed timestamps or mocks)
- Clean up database state between tests (`beforeEach` hooks)
- Check for race conditions (use `await` properly)
- Isolate tests (don't share state between tests)

### Database connection errors

- Ensure test database is running (Docker Compose)
- Check `DATABASE_URL` in test environment
- Use separate test database (not development database)

### Component tests fail with "not wrapped in act"

- Use `waitFor` for async updates
- Use `userEvent` instead of `fireEvent` for user interactions
- Ensure all state updates are awaited

---

## Test Environment Setup

### Environment Variables for Tests

Create `apps/api/.env.test`:

```
DATABASE_URL=postgresql://taskflow:taskflow@localhost:5432/taskflow_test
NODE_ENV=test
JWT_SECRET=test-secret
JWT_REFRESH_SECRET=test-refresh-secret
```

### Test Database

Use a separate test database to avoid conflicts:

```bash
# In docker-compose.yml, add test database service
# Or use separate DATABASE_URL for tests
```

---

## References

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Supertest](https://github.com/visionmedia/supertest)
