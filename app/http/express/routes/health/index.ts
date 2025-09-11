import express from "express";
import { HealthHandler } from "./HealthHandler";

/**
 * Build health routes module
 *
 * Creates and configures the health check routes.
 * This module provides a simple health check endpoint.
 *
 * @returns Express router configured with health routes
 */
export function buildHealthRoutes(): express.Router {
  const router = express.Router();
  const healthHandler = new HealthHandler();

  // GET /health - Health check endpoint
  router.get("/health", async (req, res) => {
    await healthHandler.handle(req, res);
  });

  return router;
}
