export type Profile = {
  id: string;
  name: string;
  age: number;
  photoUrl: string;
  bio: string;
  city: string;
  college: string | null;
  interests: string[];
};

export type Match = {
  id: string;
  createdAt: string;
  profile: Profile;
};

export type SwipeAction = "like" | "pass";

export type Tab = "home" | "discover" | "matches";

export type SwipeResponse = {
  targetProfileId: string;
  action: SwipeAction;
  matched: boolean;
  match: {
    id: string;
    createdAt: string;
  } | null;
};