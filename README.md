# Coy Discover

A mobile-first, swipe-based discovery app built for **Part B of the Coy SDE Intern Assignment**.

Browse profiles, like or pass, and discover mutual connections. Likes remain private until both users like each other.

**[Open the Live Demo](https://coy-discover-app.onrender.com/)** · **[GitHub Repository](https://github.com/nitin-devx/coy-discover)**

> The demo uses one shared user, as permitted by the assignment. Swipes and matches persist, so profiles already swiped by another visitor will not appear again. The free backend may take a little longer to respond after inactivity.

## Features

- **Discover feed:** one profile card at a time, with name, age, photo, bio, location, and interests.
- **Swipe interactions:** drag right to like or left to pass, with buttons available on desktop and mobile.
- **Visual feedback:** animated card transitions, directional indicators, and saving feedback.
- **Mutual matching:** an “It’s a match!” popup appears when a like creates a mutual match.
- **Matches view:** displays saved mutual connections.
- **Privacy:** incoming likes are never exposed before a mutual match.
- **Persistence:** PostgreSQL stores swipes and matches across reloads and server restarts.
- **Feed filtering:** liked and passed profiles are excluded from subsequent feeds.
- **Request handling:** validation, duplicate-swipe protection, and retry behavior.
- **UI states:** loading, error, empty-feed, and no-matches screens.
- **Navigation:** a blank Home tab alongside Discover and Matches.

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React, TypeScript, Vite |
| Styling | Tailwind CSS |
| Gestures and animation | Motion |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL hosted on Neon |
| Database access | node-postgres (`pg`) |
| Request validation | Zod |
| API testing | Vitest, Supertest |
| Hosting | Render Static Site and Render Web Service |

## Architecture

The React frontend calls the Express API. The API validates requests, applies matching rules, and reads or writes data in Neon PostgreSQL.

The frontend never connects directly to the database and does not decide whether a match exists.

Three application tables store the data:

| Table | Purpose |
|---|---|
| `profiles` | Public profile information |
| `swipes` | Directed likes and passes between profiles |
| `matches` | Unique pairs of mutually matched profiles |

The backend assumes a fixed logged-in user. Authentication is intentionally outside this assignment’s scope.

## Project Structure

```text
coy-discover/
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── types/
│   │   └── App.tsx
│   └── .env.example
├── server/
│   ├── migrations/
│   ├── src/
│   │   ├── config/
│   │   ├── db/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── app.ts
│   │   └── server.ts
│   ├── tests/
│   └── .env.example
└── README.md
```

## Run Locally

### Prerequisites

- Node.js compatible with the installed dependencies; Node.js 22.12+ on the 22.x release line satisfies the recorded Vite and Vitest requirements.
- npm and Git.
- A Neon PostgreSQL database.
- An internet connection to access Neon.

A local PostgreSQL installation or Docker is not required.

### 1. Clone the repository

```bash
git clone https://github.com/nitin-devx/coy-discover.git
cd coy-discover
```

### 2. Install dependencies

```bash
cd server
npm install --include=dev

cd ../client
npm install --include=dev

cd ..
```

### 3. Configure the backend

Create `server/.env` using `server/.env.example` as a template:

```env
PORT=4000
CLIENT_ORIGIN=http://localhost:5173
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=verify-full&channel_binding=require"
```

Replace the example connection URL with your own Neon connection details.

For local development, use a database separate from the deployed demo. Keep real environment files out of Git.

### 4. Create the schema and seed profiles

From `server`:

```bash
npm run db:migrate
npm run db:seed
```

The seed creates:

- One assumed logged-in user.
- 32 discoverable mock profiles.
- Six incoming likes to make mutual matches possible during a demo.

The seed is repeatable: it updates seeded profile details without duplicating profiles. It preserves existing swipes and matches and **does not reset the feed**.

### 5. Configure the frontend

Create `client/.env`:

```env
VITE_API_URL=http://localhost:4000
```

Only the backend URL belongs here. Never add database credentials to frontend environment variables.

### 6. Start both applications

In a terminal inside `server`:

```bash
npm run dev
```

In a second terminal inside `client`:

```bash
npm run dev
```

| Service | Local URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend health check | http://localhost:4000/health |

## API Reference

### `GET /feed`

Returns public profiles that the current user has not swiped on.

Excludes:

- The current user.
- Profiles previously liked.
- Profiles previously passed.

Example response:

```json
{
  "profiles": [
    {
      "id": "00000000-0000-4000-8000-000000000002",
      "name": "Aanya",
      "age": 20,
      "photoUrl": "https://picsum.photos/seed/coy-profile-1/600/800",
      "bio": "Usually exploring a new cafe or looking for my next good book.",
      "city": "Delhi",
      "college": "USICT",
      "interests": ["Coffee", "Reading", "Travel"]
    }
  ]
}
```

When no profiles remain:

```json
{
  "profiles": []
}
```

### `POST /swipe`

Records a like or pass.

Request:

```json
{
  "targetProfileId": "00000000-0000-4000-8000-000000000002",
  "action": "like"
}
```

Allowed actions: `like` and `pass`.

Successful response without a new match — **HTTP 201**:

```json
{
  "targetProfileId": "00000000-0000-4000-8000-000000000002",
  "action": "like",
  "matched": false,
  "match": null
}
```

When a new mutual match is created, `matched` is `true`, and `match` contains its `id` and `createdAt` timestamp.

| Status | Meaning |
|---|---|
| `201` | Swipe recorded successfully |
| `400` | Invalid request or self-swipe |
| `404` | Target profile does not exist |
| `409` | Current user already swiped on this profile |

### `GET /matches`

Returns the current user’s saved mutual matches.

Each item contains:

- `id`: match identifier.
- `createdAt`: match creation timestamp.
- `profile`: the matched person’s public profile.

When no matches exist:

```json
{
  "matches": []
}
```

## Matching, Privacy, and Consistency

A like creates a match only if the target profile has already liked the current user. A pass never creates a match.

The implementation protects these rules through:

- **Backend-controlled matching:** the client uses the API’s match result.
- **Explicit response fields:** the feed contains public profile data without incoming-like flags or counts.
- **Atomic writes:** swipe and match creation run in one database transaction.
- **Unique swipes:** each user can swipe on a given profile only once.
- **Unique match pairs:** UUIDs are stored in a consistent order to prevent duplicate reversed pairs.
- **Serialized swipe processing:** the current user’s row is locked while a swipe is processed.
- **Parameterized queries:** request values are passed as SQL parameters.
- **Frontend submission guards:** controls are disabled while a swipe is being saved.

If a duplicate swipe returns `409`, the frontend refreshes the feed and matches to recover the saved state.

## Automated Tests

Tests use a dedicated database because the suite recreates application tables and clears data between cases.

### Test database setup

Create a separate Neon testing branch and a database named exactly:

```text
coy_discover_test
```

Create `server/.env.test`:

```env
TEST_DATABASE_URL="postgresql://USER:PASSWORD@TEST_HOST/coy_discover_test?sslmode=verify-full&channel_binding=require"
```

**Never use the deployed demo database for tests.** The configuration and test setup check the database name before running.

### Run tests

From `server`:

```bash
npm test
```

Watch mode:

```bash
npm run test:watch
```

### Coverage

The integration tests cover:

- Excluding the current user from the feed.
- Excluding liked and passed profiles.
- Returning only public profile fields.
- Returning an empty feed.
- Saving one-sided likes without creating matches.
- Creating mutual matches.
- Passing on an incoming liker without revealing the like.
- Rejecting duplicate swipes.
- Handling simultaneous duplicate requests.
- Validating request bodies and malformed JSON.
- Rejecting self-swipes and unknown profiles.
- Returning only the current user’s matches.

## Build and Quality Checks

From `server`:

```bash
npm run typecheck
npm run typecheck:test
npm run build
npm test
```

From `client`:

```bash
npm run lint
npm run build
```

## Deployment

The frontend and backend are deployed separately on Render, with PostgreSQL hosted on Neon.

| Setting | Frontend | Backend |
|---|---|---|
| Service type | Static Site | Web Service |
| Root directory | `client` | `server` |
| Build command | `npm install --include=dev && npm run build` | `npm install --include=dev && npm run build` |
| Publish directory | `dist` | — |
| Start command | — | `npm start` |

### Production environment variables

**Frontend:**

```env
VITE_API_URL=https://YOUR_BACKEND.onrender.com
```

**Backend:**

```env
DATABASE_URL=YOUR_PRODUCTION_NEON_CONNECTION_URL
CLIENT_ORIGIN=https://coy-discover-app.onrender.com
NODE_ENV=production
```

Render supplies the backend’s `PORT`.

Changes to `VITE_API_URL` require rebuilding the frontend. Set `CLIENT_ORIGIN` to the exact frontend origin without a trailing slash.

The deployment currently uses `npm install` to work around missing transitive entries encountered in the lock file. Returning to `npm ci` requires repairing and validating the committed lock file.

## Reviewer Walkthrough

1. Open [the live demo](https://coy-discover-app.onrender.com/).
2. Confirm the Home tab is blank.
3. Open Discover and inspect the profile details.
4. Like or pass using a button or horizontal drag.
5. Refresh the browser to confirm the profile remains excluded.
6. When a mutual like occurs, check the match popup.
7. Open Matches and refresh to confirm the connection remains saved.

The shared live demo may already contain swipes from earlier visitors. For a predictable walkthrough with all 32 profiles, use a fresh database and run the local migration and seed commands.

On fresh seed data, liking Aanya creates a mutual match. This is a reviewer fixture detail, not information shown in the discovery interface.

## Scope and Limitations

- Implements Part B: Discover and mutual matching.
- Assumes one logged-in user; all live visitors share that user’s state.
- Uses fictional profiles and placeholder images, as permitted by the assignment.
- Does not include authentication, messaging, or payments.
- Returns all remaining profiles without pagination.
- A free backend can respond slowly when waking after inactivity.
- Existing swipes are preserved; refreshing or reseeding does not reset the demo.