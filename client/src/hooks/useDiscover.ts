import { useCallback, useEffect, useRef, useState } from "react";
import {
  ApiError,
  fetchFeed,
  fetchMatches,
  postSwipe,
} from "../lib/api";
import type { Match, Profile, SwipeAction } from "../types";

export function useDiscover() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [swipeError, setSwipeError] = useState("");
  const [swiping, setSwiping] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [direction, setDirection] = useState(1);
  const [matchedProfile, setMatchedProfile] = useState<Profile | null>(null);

  const busyRef = useRef(false);

  const loadData = useCallback(async (signal?: AbortSignal) => {
    try {
      const [feedResult, matchesResult] = await Promise.all([
        fetchFeed(signal),
        fetchMatches(signal),
      ]);

      if (signal?.aborted) return;

      setProfiles(feedResult.profiles);
      setMatches(matchesResult.matches);
      setLoadError("");
    } catch (error) {
      if (signal?.aborted) return;

      setLoadError(
        error instanceof ApiError
          ? error.message
          : "Could not reach the server. Check your connection and try again.",
      );
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, []);

 useEffect(() => {
  const controller = new AbortController();
  const { signal } = controller;

  Promise.all([
    fetchFeed(signal),
    fetchMatches(signal),
  ])
    .then(([feedResult, matchesResult]) => {
      if (signal.aborted) return;

      setProfiles(feedResult.profiles);
      setMatches(matchesResult.matches);
      setLoadError("");
    })
    .catch((error: unknown) => {
      if (signal.aborted) return;

      setLoadError(
        error instanceof ApiError
          ? error.message
          : "Could not reach the server. Check your connection and try again.",
      );
    })
    .finally(() => {
      if (!signal.aborted) {
        setLoading(false);
      }
    });

  return () => {
    controller.abort();
  };
}, []);

  async function reload() {
    if (busyRef.current || loading) return;

    busyRef.current = true;
    setLoading(true);
    setSwipeError("");
    setFeedback("");

    try {
      await loadData();
    } finally {
      busyRef.current = false;
    }
  }

  async function swipe(action: SwipeAction) {
    const profile = profiles[0];

    if (!profile || busyRef.current || loading || loadError) return;

    busyRef.current = true;
    setSwiping(true);
    setSwipeError("");
    setFeedback("");
    setDirection(action === "like" ? 1 : -1);

    try {
      const result = await postSwipe(profile.id, action);

      setProfiles((previous) =>
        previous.filter((item) => item.id !== profile.id),
      );

      setFeedback(
        action === "like"
          ? `You liked ${profile.name}.`
          : `You passed on ${profile.name}.`,
      );

      if (result.matched && result.match) {
        const newMatch: Match = {
          id: result.match.id,
          createdAt: result.match.createdAt,
          profile,
        };

        setMatches((previous) => [
          newMatch,
          ...previous.filter((item) => item.id !== newMatch.id),
        ]);

        setMatchedProfile(profile);
      }
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setLoading(true);
        await loadData();

        setFeedback(
          "This profile was already swiped. Your feed and matches were refreshed.",
        );
      } else {
        setSwipeError(
          error instanceof ApiError
            ? error.message
            : "Could not confirm your swipe. Check your connection, then retry or refresh.",
        );
      }
    } finally {
      busyRef.current = false;
      setSwiping(false);
    }
  }

  return {
    profiles,
    matches,
    loading,
    loadError,
    swipeError,
    swiping,
    feedback,
    direction,
    matchedProfile,
    reload,
    swipe,
    closeMatch: () => setMatchedProfile(null),
  };
}