import type { Match, Profile } from "../types";

export const mockProfiles: Profile[] = [
  {
    id: "00000000-0000-4000-8000-000000000002",
    name: "Aanya",
    age: 22,
    photoUrl: "https://picsum.photos/seed/coy-profile-1/600/800",
    bio: "Usually exploring a new cafe or looking for my next good book.",
    city: "Delhi",
    college: "Delhi University",
    interests: ["Coffee", "Reading", "Travel"],
  },
  {
    id: "00000000-0000-4000-8000-000000000003",
    name: "Aarav",
    age: 23,
    photoUrl: "https://picsum.photos/seed/coy-profile-2/600/800",
    bio: "Badminton after class and music for every mood.",
    city: "New Delhi",
    college: "NSUT",
    interests: ["Badminton", "Music", "Fitness"],
  },
  {
    id: "00000000-0000-4000-8000-000000000004",
    name: "Diya",
    age: 21,
    photoUrl: "https://picsum.photos/seed/coy-profile-3/600/800",
    bio: "Weekend walks, photography, and sunsets are my kind of plans.",
    city: "Delhi",
    college: "USICT",
    interests: ["Photography", "Walking", "Nature"],
  },
];

export const mockMatch: Match = {
  id: "preview-match",
  createdAt: "2026-11-18T00:00:00.000Z",
  profile: mockProfiles[0]!,
};