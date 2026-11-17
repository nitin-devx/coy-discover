import { Router } from "express";
import { z } from "zod";
import {
  getFeed,
  getMatches,
  recordSwipe,
} from "../services/discoverService.js";

export const discoverRouter = Router();

const swipeSchema = z
  .object({
    targetProfileId: z.string().uuid(),
    action: z.enum(["like", "pass"]),
  })
  .strict();

discoverRouter.get("/feed", async (_req, res, next) => {
  try {
    const profiles = await getFeed();

    res.status(200).json({ profiles });
  } catch (error) {
    next(error);
  }
});

discoverRouter.post("/swipe", async (req, res, next) => {
  const parsed = swipeSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      message: "Invalid swipe request",
      errors: parsed.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }

  try {
    const result = await recordSwipe(
      parsed.data.targetProfileId,
      parsed.data.action,
    );

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

discoverRouter.get("/matches", async (_req, res, next) => {
  try {
    const matches = await getMatches();

    res.status(200).json({ matches });
  } catch (error) {
    next(error);
  }
});