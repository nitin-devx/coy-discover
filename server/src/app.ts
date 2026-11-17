import express from "express";
import type { ErrorRequestHandler } from "express";
import cors from "cors";
import { discoverRouter } from "./routes/discoverRoutes.js";
import { ApiError } from "./utils/ApiError.js";

export const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
  }),
);

app.use(express.json({ limit: "10kb" }));

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Coy Discover API is running",
  });
});

app.use(discoverRouter);

app.use((_req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});

const errorHandler: ErrorRequestHandler = (
  error: unknown,
  _req,
  res,
  _next,
) => {
  if (error instanceof ApiError) {
    res.status(error.statusCode).json({
      message: error.message,
    });
    return;
  }

  if (
    error instanceof SyntaxError &&
    "type" in error &&
    error.type === "entity.parse.failed"
  ) {
    res.status(400).json({
      message: "Request body contains invalid JSON",
    });
    return;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "type" in error &&
    error.type === "entity.too.large"
  ) {
    res.status(413).json({
      message: "Request body is too large",
    });
    return;
  }

  console.error(
    "Request failed:",
    error instanceof Error ? error.message : "Unknown error",
  );

  res.status(500).json({
    message: "Something went wrong. Please try again.",
  });
};

app.use(errorHandler);