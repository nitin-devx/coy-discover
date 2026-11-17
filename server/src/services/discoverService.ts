import { pool } from "../db/pool.js";
import { CURRENT_USER_ID } from "../config/currentUser.js";
import { ApiError } from "../utils/ApiError.js";

type SwipeAction = "like" | "pass";

type Profile = {
  id: string;
  name: string;
  age: number;
  photoUrl: string;
  bio: string;
  city: string;
  college: string | null;
  interests: string[];
};

type MatchRecord = {
  id: string;
  createdAt: Date;
};

type MatchRow = Profile & {
  matchId: string;
  matchedAt: Date;
};

const profileColumns = `
  p.id,
  p.name,
  p.age,
  p.photo_url AS "photoUrl",
  p.bio,
  p.city,
  p.college,
  p.interests
`;

export async function getFeed(): Promise<Profile[]> {
  const result = await pool.query<Profile>(
    `
      SELECT ${profileColumns}
      FROM profiles AS p
      WHERE p.id <> $1
        AND NOT EXISTS (
          SELECT 1
          FROM swipes AS s
          WHERE s.swiper_id = $1
            AND s.target_id = p.id
        )
      ORDER BY p.id
    `,
    [CURRENT_USER_ID],
  );

  return result.rows;
}

export async function recordSwipe(
  targetProfileId: string,
  action: SwipeAction,
) {
  const targetId = targetProfileId.toLowerCase();

  if (targetId === CURRENT_USER_ID) {
    throw new ApiError(400, "You cannot swipe on yourself");
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const currentUser = await client.query(
      `
        SELECT id
        FROM profiles
        WHERE id = $1
        FOR UPDATE
      `,
      [CURRENT_USER_ID],
    );

    if (currentUser.rows.length === 0) {
      throw new ApiError(
        503,
        "Demo user is missing. Run the database seed.",
      );
    }

    const target = await client.query(
      "SELECT id FROM profiles WHERE id = $1",
      [targetId],
    );

    if (target.rows.length === 0) {
      throw new ApiError(404, "Profile not found");
    }

    const swipe = await client.query(
      `
        INSERT INTO swipes (swiper_id, target_id, action)
        VALUES ($1, $2, $3)
        ON CONFLICT (swiper_id, target_id) DO NOTHING
        RETURNING id
      `,
      [CURRENT_USER_ID, targetId, action],
    );

    if (swipe.rows.length === 0) {
      throw new ApiError(409, "You have already swiped on this profile");
    }

    let match: MatchRecord | null = null;

    if (action === "like") {
      const incomingLike = await client.query(
        `
          SELECT id
          FROM swipes
          WHERE swiper_id = $1
            AND target_id = $2
            AND action = 'like'
        `,
        [targetId, CURRENT_USER_ID],
      );

      if (incomingLike.rows.length > 0) {
        const createdMatch = await client.query<MatchRecord>(
          `
            INSERT INTO matches (user_one_id, user_two_id)
            VALUES (
              LEAST($1::uuid, $2::uuid),
              GREATEST($1::uuid, $2::uuid)
            )
            ON CONFLICT (user_one_id, user_two_id) DO NOTHING
            RETURNING id, created_at AS "createdAt"
          `,
          [CURRENT_USER_ID, targetId],
        );

        match = createdMatch.rows[0] ?? null;
      }
    }

    await client.query("COMMIT");

    return {
      targetProfileId: targetId,
      action,
      matched: match !== null,
      match,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function getMatches() {
  const result = await pool.query<MatchRow>(
    `
      SELECT
        m.id AS "matchId",
        m.created_at AS "matchedAt",
        ${profileColumns}
      FROM matches AS m
      JOIN profiles AS p
        ON p.id = CASE
          WHEN m.user_one_id = $1 THEN m.user_two_id
          ELSE m.user_one_id
        END
      WHERE m.user_one_id = $1
         OR m.user_two_id = $1
      ORDER BY m.created_at DESC, m.id
    `,
    [CURRENT_USER_ID],
  );

  return result.rows.map(({ matchId, matchedAt, ...profile }) => ({
    id: matchId,
    createdAt: matchedAt,
    profile,
  }));
}