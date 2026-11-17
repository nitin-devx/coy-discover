import type {
  Match,
  Profile,
  SwipeAction,
  SwipeResponse,
} from "../types";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:4000"
).replace(/\/$/, "");

export class ApiError extends Error {
  public readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, options);

  if (!response.ok) {
    let message = `Request failed (${response.status})`;

    try {
      const body: unknown = await response.json();

      if (
        typeof body === "object" &&
        body !== null &&
        "message" in body &&
        typeof body.message === "string"
      ) {
        message = body.message;
      }
    } catch {
      // Keep the fallback message if the response is not JSON.
    }

    throw new ApiError(response.status, message);
  }

  return response.json() as Promise<T>;
}

export function fetchFeed(signal?: AbortSignal) {
  return apiRequest<{ profiles: Profile[] }>("/feed", { signal });
}

export function fetchMatches(signal?: AbortSignal) {
  return apiRequest<{ matches: Match[] }>("/matches", { signal });
}

export function postSwipe(
  targetProfileId: string,
  action: SwipeAction,
) {
  return apiRequest<SwipeResponse>("/swipe", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ targetProfileId, action }),
  });
}