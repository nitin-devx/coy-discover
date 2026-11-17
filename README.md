# Coy Discover

A mobile-first discovery app built for the Coy SDE Intern Assignment.

Users can browse profiles, like or pass using buttons or drag gestures,
and view mutual matches. Likes remain private until both users like each other.

## Tech stack

- Frontend: React, TypeScript, Vite, Tailwind CSS
- Animations and gestures: Motion
- Backend: Node.js, Express, TypeScript
- Database: PostgreSQL hosted on Neon
- Database client: node-postgres (`pg`)
- Validation: Zod
- Testing: Vitest and Supertest

## Features

- Blank Home tab and functional Discover tab
- 32 seeded discoverable profiles
- One profile card displayed at a time
- Like/pass buttons and horizontal drag gestures
- Card animations and swipe feedback
- Mutual-match popup
- Matches view
- Persistent swipes and matches
- Previously swiped profiles excluded from the feed
- Loading, error, retry, and empty states
- Duplicate-swipe protection

## Project structure

- `client/`: React frontend
- `server/src/`: Express API and database services
- `server/migrations/`: SQL schema migrations
- `server/tests/`: API integration tests
- `docs/part-a.md`: Coy product observations and feature suggestions

## Local setup

Use a Node.js version supported by the installed Vite version.

### 1. Install dependencies

From the project root:

```powershell
cd server
npm ci
cd ../client
npm ci
cd ..
```

### 2. Configure the backend

Copy `server/.env.example` to `server/.env`.

Set `DATABASE_URL` to your Neon PostgreSQL connection string.
Preserve the SSL parameters supplied by Neon.

```env
PORT=4000
CLIENT_ORIGIN=http://localhost:5173
DATABASE_URL="your_neon_connection_string"
```

### 3. Create and seed the database

From `server`:

```powershell
npm run db:migrate
npm run db:seed
```

The seed creates one assumed logged-in user, 32 other profiles,
and six incoming likes.

Rerunning the seed updates seeded profile details but preserves
existing swipes and matches. It does not reset the demo.

### 4. Configure the frontend

Copy `client/.env.example` to `client/.env`:

```env
VITE_API_URL=http://localhost:4000
```

### 5. Start the app

In a terminal inside `server`:

```powershell
npm run dev
```

In another terminal inside `client`:

```powershell
npm run dev
```

Frontend: http://localhost:5173

Backend health check: http://localhost:4000/health

## API

### GET /feed

Returns public profiles the current user has not swiped on.

Response shape:

```json
{
  "profiles": []
}
```

### POST /swipe

Request example:

```json
{
  "targetProfileId": "00000000-0000-4000-8000-000000000002",
  "action": "like"
}
```

Supported actions: `like`, `pass`.

Successful requests return HTTP 201 with:

- `targetProfileId`
- `action`
- `matched`: whether this request created a new match
- `match`: the new match ID and creation time, or null

Error responses:

- 400: invalid input or self-swipe
- 404: target profile does not exist
- 409: profile already swiped on

### GET /matches

Returns the current user's mutual matches and their public profile details.

Response shape:

```json
{
  "matches": []
}
```

## Matching and privacy

The backend uses a fixed current-user ID, as permitted by the assignment.
There is no authentication flow.

A match is created only when the current user likes a profile that
has already liked them.

The feed returns explicitly selected public profile fields.
Incoming likes are not exposed through the API.

Swipe and match creation happen in one database transaction.
Database constraints prevent duplicate swipes and duplicate match pairs.

The current user's row is locked during swipe processing to serialize
overlapping requests in this single-user demo.

## Automated tests

Create a separate Neon testing branch and a database named:

```text
coy_discover_test
```

Create `server/.env.test`:

```env
TEST_DATABASE_URL="your_test_database_connection_string"
```

The tests rebuild their application tables and clear them between cases.
Use this dedicated test database, never the demo database.

From `server`:

```powershell
npm test
```

Tests cover feed filtering, request validation, mutual matching,
duplicate and concurrent swipes, privacy, and match ownership.

## Build and code checks

From `server`:

```powershell
npm run typecheck
npm run typecheck:test
npm run build
npm test
```

From `client`:

```powershell
npm run lint
npm run build
```

## Demo flow

1. Open Discover.
2. Like or pass on a profile.
3. Refresh to confirm the profile stays excluded.
4. Like a seeded incoming liker to trigger a match.
5. Open Matches.
6. Try horizontal dragging on a mobile-sized screen.

On fresh seed data, incoming likers include Aanya, Ishita,
Ananya, Saanvi, Avni, and Tara.

This information is provided for reviewer testing only and is not
displayed in the application's discovery interface.

## Scope and limitations

- Assumes one logged-in user.
- Uses fictional profiles and placeholder images.
- Does not implement authentication, chat, or payments.
- The feed returns all remaining profiles without pagination.
- All visitors to a shared deployment would use the same demo user.

## Part A

See [Part A: product observations and suggestions](docs/part-a.md).