import { pool } from "./pool.js";
import { CURRENT_USER_ID } from "../config/currentUser.js";

type SeedProfile = {
  id: string;
  name: string;
  age: number;
  photoUrl: string;
  bio: string;
  city: string;
  college: string;
  interests: string[];
};

const names = [
  "Aanya",
  "Aarav",
  "Diya",
  "Vihaan",
  "Ishita",
  "Arjun",
  "Meera",
  "Kabir",
  "Ananya",
  "Rohan",
  "Kiara",
  "Aditya",
  "Saanvi",
  "Ishaan",
  "Riya",
  "Dev",
  "Avni",
  "Dhruv",
  "Myra",
  "Aryan",
  "Tara",
  "Krish",
  "Naina",
  "Reyansh",
  "Sara",
  "Yash",
  "Pihu",
  "Ved",
  "Anika",
  "Kunal",
  "Zoya",
  "Neil",
];

const locations = [
  { city: "Delhi", college: "USICT" },
  { city: "Delhi", college: "Delhi University" },
  { city: "New Delhi", college: "NSUT" },
  { city: "Delhi", college: "DTU" },
  { city: "Noida", college: "Amity University" },
  { city: "Greater Noida", college: "Bennett University" },
  { city: "Gurugram", college: "The NorthCap University" },
  { city: "Faridabad", college: "J.C. Bose University" },
];

const personalities = [
  {
    bio: "Usually exploring a new cafe or looking for my next good book.",
    interests: ["Coffee", "Reading", "Travel"],
  },
  {
    bio: "Badminton after class and music for every mood.",
    interests: ["Badminton", "Music", "Fitness"],
  },
  {
    bio: "I enjoy building small projects and finding great street food.",
    interests: ["Coding", "Technology", "Food"],
  },
  {
    bio: "Weekend walks, photography, and sunsets are my kind of plans.",
    interests: ["Photography", "Walking", "Nature"],
  },
  {
    bio: "Always ready for a movie night or a competitive board game.",
    interests: ["Movies", "Board games", "Cooking"],
  },
  {
    bio: "Learning guitar and planning trips that may actually happen.",
    interests: ["Guitar", "Travel", "Music"],
  },
  {
    bio: "Art galleries, sketchbooks, and conversations that last for hours.",
    interests: ["Art", "Drawing", "Books"],
  },
  {
    bio: "Cricket on weekends and trying a new recipe whenever I can.",
    interests: ["Cricket", "Cooking", "Fitness"],
  },
];

function createProfileId(index: number): string {
  const suffix = String(index + 2).padStart(12, "0");

  return `00000000-0000-4000-8000-${suffix}`;
}

const discoverProfiles: SeedProfile[] = names.map((name, index) => {
  const location = locations[index % locations.length]!;
  const personality = personalities[index % personalities.length]!;

  return {
    id: createProfileId(index),
    name,
    age: 20 + (index % 7),
    photoUrl: `https://picsum.photos/seed/coy-profile-${index + 1}/600/800`,
    bio: personality.bio,
    city: location.city,
    college: location.college,
    interests: personality.interests,
  };
});

const currentUser: SeedProfile = {
  id: CURRENT_USER_ID,
  name: "Nitin",
  age: 22,
  photoUrl: "https://picsum.photos/seed/coy-current-user/600/800",
  bio: "IT student who enjoys building projects and meeting new people.",
  city: "Delhi",
  college: "USICT",
  interests: ["Coding", "Fitness", "Music"],
};

const incomingLikeIndexes = [0, 4, 8, 12, 16, 20];

async function seed(): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    for (const profile of [currentUser, ...discoverProfiles]) {
      await client.query(
        `
          INSERT INTO profiles (
            id,
            name,
            age,
            photo_url,
            bio,
            city,
            college,
            interests
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            age = EXCLUDED.age,
            photo_url = EXCLUDED.photo_url,
            bio = EXCLUDED.bio,
            city = EXCLUDED.city,
            college = EXCLUDED.college,
            interests = EXCLUDED.interests
        `,
        [
          profile.id,
          profile.name,
          profile.age,
          profile.photoUrl,
          profile.bio,
          profile.city,
          profile.college,
          profile.interests,
        ],
      );
    }

    for (const index of incomingLikeIndexes) {
      const profile = discoverProfiles[index];

      if (!profile) {
        throw new Error(`Missing seed profile at index ${index}`);
      }

      await client.query(
        `
          INSERT INTO swipes (swiper_id, target_id, action)
          VALUES ($1, $2, 'like')
          ON CONFLICT (swiper_id, target_id) DO NOTHING
        `,
        [profile.id, CURRENT_USER_ID],
      );
    }

    await client.query("COMMIT");

    console.log("Seed completed successfully.");
    console.log("Ensured 1 current user and 32 discoverable profiles.");
    console.log("Ensured 6 demo incoming swipes.");
    console.log("Existing swipes and matches were preserved.");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

seed()
  .catch((error: unknown) => {
    console.error(
      "Seed failed:",
      error instanceof Error ? error.message : "Unknown error",
    );

    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });