import express, { type RequestHandler } from "express";
import { LoginHandler } from "./handlers/LoginHandler";
import { RegisterHandler } from "./handlers/RegisterHandler";
import { DebugAuthHandler } from "./handlers/DebugAuthHandler";
import type { RegisterAccountDeps, LoginDeps } from "app/ports/Deps";

/**
 * Build auth routes using the new modular architecture
 *
 * Creates routes for authentication endpoints:
 * - POST /register - User registration
 * - POST /login - User login
 * - GET /debug/auth - Debug authentication (requires auth middleware)
 *
 * @param deps - Dependencies required for auth operations
 * @param authMiddleware - Optional authentication middleware for protected routes
 * @returns Express router with auth routes
 */
export function buildAuthRoutes(
  deps: RegisterAccountDeps & LoginDeps,
  authMiddleware?: RequestHandler,
): express.Router {
  const router = express.Router();

  // Create handler instances
  const loginHandler = new LoginHandler(deps);
  const registerHandler = new RegisterHandler(deps);
  const debugAuthHandler = new DebugAuthHandler();

  // Registration route (public)
  router.post("/register", async (req, res) => {
    await registerHandler.handle(req, res);
  });

  // Login route (public)
  router.post("/login", async (req, res) => {
    await loginHandler.handle(req, res);
  });

  // Debug auth route (protected - requires middleware)
  if (authMiddleware) {
    router.get("/debug/auth", authMiddleware, async (req, res) => {
      await debugAuthHandler.handle(req, res);
    });
  }

  return router;
}
