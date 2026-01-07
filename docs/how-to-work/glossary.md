# Glossary

> **Document Type**: State (keep current)
> 
> Last updated: 2026-01-07

Domain terms and their definitions. Keep alphabetically sorted.

---

## A

**Access Token**: A short-lived JWT token (typically 15 minutes) used to authenticate API requests. Stored in memory on the frontend and sent in the `Authorization: Bearer <token>` header. See also: Refresh Token, JWT.

---

## C

**Category**: A label used to group tasks (e.g., "Work", "Personal"). Categories are a Should-Have feature in v1.0. See also: Task, Label.

**Core CRUD**: Create, Read, Update, Delete operations for tasks. This is a Must-Have feature in v1.0.

---

## D

**Due Date**: An optional timestamp indicating when a task should be completed. Due dates are a Should-Have feature in v1.0. See also: Task.

---

## J

**JWT (JSON Web Token)**: A compact, URL-safe token format used for authentication. TaskFlow uses JWTs for access tokens and refresh tokens. See also: Access Token, Refresh Token.

---

## L

**Label**: A tag or category assigned to a task. Labels help organize and filter tasks. See also: Category, Task.

---

## P

**Persistence**: The ability to save and retrieve data across sessions and devices. TaskFlow achieves persistence through PostgreSQL database syncing via the API.

---

## R

**Refresh Token**: A long-lived token (typically 7 days) used to obtain new access tokens when they expire. Stored in an httpOnly cookie and automatically sent with requests. Refresh tokens are rotated on each use for security. See also: Access Token, JWT, Token Rotation.

---

## S

**Session**: A period of user interaction with the application. TaskFlow uses stateless JWT-based authentication, so sessions are managed via token expiration rather than server-side session storage.

**State Toggle**: The ability to instantly switch a task between "Complete" and "Incomplete" status. This is a Must-Have feature in v1.0. See also: Task.

---

## T

**Task**: A single to-do item in TaskFlow. Tasks have a title, completion status, creation date, and optionally a due date and category. See also: Core CRUD, State Toggle, Due Date, Category.

**Token Rotation**: A security practice where refresh tokens are invalidated and replaced with new tokens each time they're used. This limits the impact of token theft. See also: Refresh Token.

---

## U

**User**: An authenticated account in TaskFlow. Users can create, view, edit, and delete their own tasks. See also: Authentication, Access Token.

---

*Add terms in the format:*

```
**Term**: Definition. Additional context if needed. See also: Related Term.
```
