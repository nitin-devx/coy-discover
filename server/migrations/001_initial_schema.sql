CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(trim(name)) > 0),
  age INTEGER NOT NULL CHECK (age >= 18),
  photo_url TEXT NOT NULL,
  bio TEXT NOT NULL,
  city TEXT NOT NULL,
  college TEXT,
  interests TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE swipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  swiper_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('like', 'pass')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT swipes_unique_pair UNIQUE (swiper_id, target_id),
  CONSTRAINT swipes_no_self CHECK (swiper_id <> target_id)
);

CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_one_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_two_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT matches_unique_pair UNIQUE (user_one_id, user_two_id),
  CONSTRAINT matches_ordered_pair CHECK (user_one_id < user_two_id)
);

CREATE INDEX matches_user_two_idx ON matches (user_two_id);