import { readFile } from "node:fs/promises";
import path from "node:path";
import request from "supertest";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import { app } from "../src/app.js";
import { pool } from "../src/db/pool.js";
import { CURRENT_USER_ID } from "../src/config/currentUser.js";

const LIKES_ME_ID = "00000000-0000-4000-8000-000000000002";
const NO_LIKE_ID = "00000000-0000-4000-8000-000000000003";
const OTHER_ID = "00000000-0000-4000-8000-000000000004";
const MISSING_ID = "00000000-0000-4000-8000-000000000099";

const publicProfileKeys = [
  "id",
  "name",
  "age",
  "photoUrl",
  "bio",
  "city",
  "college",
  "interests",
].sort();

async function insertProfile(id: string, name: string) {
  await pool.query(
    `
      INSERT INTO profiles (
        id, name, age, photo_url, bio, city, college, interests
      )
      VALUES ($1, $2, 22, $3, $4, $5, $6, $7)
    `,
    [
      id,
      name,
      "https://example.com/profile.jpg",
      "Test profile",
      "Delhi",
      "Test College",
      ["Coding", "Music"],
    ],
  );
}

function swipe(targetProfileId: string, action: "like" | "pass") {
  return request(app)
    .post("/swipe")
    .send({ targetProfileId, action });
}

beforeAll(async () => {
  const result = await pool.query<{ name: string }>(
    "SELECT current_database() AS name",
  );

  if (result.rows[0]?.name !== "coy_discover_test") {
    throw new Error("Refusing to modify a non-test database");
  }

  const migration = await readFile(
    path.resolve("migrations/001_initial_schema.sql"),
    "utf8",
  );

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(`
      DROP TABLE IF EXISTS matches;
      DROP TABLE IF EXISTS swipes;
      DROP TABLE IF EXISTS profiles;
    `);

    await client.query(migration);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
});

beforeEach(async () => {
  await pool.query("TRUNCATE TABLE matches, swipes, profiles");

  await insertProfile(CURRENT_USER_ID, "Nitin");
  await insertProfile(LIKES_ME_ID, "Aanya");
  await insertProfile(NO_LIKE_ID, "Aarav");
  await insertProfile(OTHER_ID, "Diya");

  await pool.query(
    `
      INSERT INTO swipes (swiper_id, target_id, action)
      VALUES ($1, $2, 'like')
    `,
    [LIKES_ME_ID, CURRENT_USER_ID],
  );
});

afterAll(async () => {
  await pool.end();
});

describe("GET /feed", () => {
  it("returns other profiles but excludes the current user", async () => {
    const response = await request(app).get("/feed");

    expect(response.status).toBe(200);

    expect(
      response.body.profiles.map((profile: { id: string }) => profile.id),
    ).toEqual([LIKES_ME_ID, NO_LIKE_ID, OTHER_ID]);
  });

  it("returns only public fields, without revealing incoming likes", async () => {
    const response = await request(app).get("/feed");

    expect(response.status).toBe(200);
    expect(Object.keys(response.body)).toEqual(["profiles"]);
    expect(response.body.profiles).toHaveLength(3);

    for (const profile of response.body.profiles) {
      expect(Object.keys(profile).sort()).toEqual(publicProfileKeys);
    }
  });

  it("excludes both liked and passed profiles", async () => {
    expect((await swipe(NO_LIKE_ID, "like")).status).toBe(201);
    expect((await swipe(OTHER_ID, "pass")).status).toBe(201);

    const response = await request(app).get("/feed");

    expect(response.status).toBe(200);
    expect(
      response.body.profiles.map((profile: { id: string }) => profile.id),
    ).toEqual([LIKES_ME_ID]);
  });

  it("returns an empty array when all profiles have been swiped", async () => {
    for (const id of [LIKES_ME_ID, NO_LIKE_ID, OTHER_ID]) {
      expect((await swipe(id, "pass")).status).toBe(201);
    }

    const response = await request(app).get("/feed");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ profiles: [] });
  });
});

describe("POST /swipe", () => {
  it("saves a one-sided like without creating a match", async () => {
    const response = await swipe(NO_LIKE_ID, "like");

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      targetProfileId: NO_LIKE_ID,
      action: "like",
      matched: false,
      match: null,
    });

    const saved = await pool.query(
      `
        SELECT action FROM swipes
        WHERE swiper_id = $1 AND target_id = $2
      `,
      [CURRENT_USER_ID, NO_LIKE_ID],
    );

    expect(saved.rows).toEqual([{ action: "like" }]);

    const matches = await pool.query("SELECT id FROM matches");
    expect(matches.rows).toHaveLength(0);
  });

  it("creates a match when the like is mutual", async () => {
    const response = await swipe(LIKES_ME_ID, "like");

    expect(response.status).toBe(201);
    expect(response.body.matched).toBe(true);
    expect(response.body.match).toEqual({
      id: expect.any(String),
      createdAt: expect.any(String),
    });

    const matches = await request(app).get("/matches");

    expect(matches.status).toBe(200);
    expect(matches.body.matches).toHaveLength(1);
    expect(matches.body.matches[0].id).toBe(response.body.match.id);
    expect(matches.body.matches[0].profile.id).toBe(LIKES_ME_ID);
  });

  it("does not reveal an incoming like when the user passes", async () => {
    const response = await swipe(LIKES_ME_ID, "pass");

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      targetProfileId: LIKES_ME_ID,
      action: "pass",
      matched: false,
      match: null,
    });

    const matches = await pool.query("SELECT id FROM matches");
    expect(matches.rows).toHaveLength(0);
  });

  it("rejects a duplicate swipe without changing the original", async () => {
    expect((await swipe(NO_LIKE_ID, "pass")).status).toBe(201);

    const duplicate = await swipe(NO_LIKE_ID, "like");

    expect(duplicate.status).toBe(409);

    const saved = await pool.query(
      `
        SELECT action FROM swipes
        WHERE swiper_id = $1 AND target_id = $2
      `,
      [CURRENT_USER_ID, NO_LIKE_ID],
    );

    expect(saved.rows).toEqual([{ action: "pass" }]);
  });

  it("handles simultaneous duplicate likes with only one match", async () => {
    const responses = await Promise.all([
      swipe(LIKES_ME_ID, "like"),
      swipe(LIKES_ME_ID, "like"),
    ]);

    expect(responses.map((response) => response.status).sort()).toEqual([
      201, 409,
    ]);

    const matches = await pool.query("SELECT id FROM matches");
    expect(matches.rows).toHaveLength(1);

    const swipes = await pool.query(
      `
        SELECT id FROM swipes
        WHERE swiper_id = $1 AND target_id = $2
      `,
      [CURRENT_USER_ID, LIKES_ME_ID],
    );

    expect(swipes.rows).toHaveLength(1);
  });

  it.each([
    {},
    { targetProfileId: "not-a-uuid", action: "like" },
    { targetProfileId: NO_LIKE_ID, action: "love" },
    {
      targetProfileId: NO_LIKE_ID,
      action: "like",
      userId: OTHER_ID,
    },
  ])("rejects invalid request data: %j", async (body) => {
    const response = await request(app).post("/swipe").send(body);

    expect(response.status).toBe(400);

    const outgoing = await pool.query(
      "SELECT id FROM swipes WHERE swiper_id = $1",
      [CURRENT_USER_ID],
    );

    expect(outgoing.rows).toHaveLength(0);
  });

  it("rejects a swipe on the current user", async () => {
    const response = await swipe(CURRENT_USER_ID, "like");

    expect(response.status).toBe(400);
  });

  it("returns 404 for a profile that does not exist", async () => {
    const response = await swipe(MISSING_ID, "like");

    expect(response.status).toBe(404);

    const outgoing = await pool.query(
      "SELECT id FROM swipes WHERE swiper_id = $1",
      [CURRENT_USER_ID],
    );

    expect(outgoing.rows).toHaveLength(0);
  });

  it("returns 400 for malformed JSON", async () => {
    const response = await request(app)
      .post("/swipe")
      .set("Content-Type", "application/json")
      .send('{"action":');

    expect(response.status).toBe(400);
  });
});

describe("GET /matches", () => {
  it("does not expose an incoming like as a match", async () => {
    const response = await request(app).get("/matches");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ matches: [] });
  });

  it("returns only the current user's matches with public profile fields", async () => {
    expect((await swipe(LIKES_ME_ID, "like")).status).toBe(201);

    await pool.query(
      `
        INSERT INTO swipes (swiper_id, target_id, action)
        VALUES ($1, $2, 'like'), ($2, $1, 'like')
      `,
      [NO_LIKE_ID, OTHER_ID],
    );

    await pool.query(
      `
        INSERT INTO matches (user_one_id, user_two_id)
        VALUES (
          LEAST($1::uuid, $2::uuid),
          GREATEST($1::uuid, $2::uuid)
        )
      `,
      [NO_LIKE_ID, OTHER_ID],
    );

    const response = await request(app).get("/matches");

    expect(response.status).toBe(200);
    expect(response.body.matches).toHaveLength(1);

    const match = response.body.matches[0];

    expect(Object.keys(match).sort()).toEqual([
      "createdAt",
      "id",
      "profile",
    ]);
    expect(match.profile.id).toBe(LIKES_ME_ID);
    expect(Object.keys(match.profile).sort()).toEqual(publicProfileKeys);
  });
});