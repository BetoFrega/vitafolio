import express from "express";
import { buildRoutes } from "./routes";
import { makeAuthenticationMiddleware } from "./middleware/makeAuthenticationMiddleware";
import type { Deps } from "../../ports/Deps";

export function makeExpressApp(deps: Deps) {
  const app = express();
  app.use(express.json());

  // Create authentication middleware
  const authMiddleware = makeAuthenticationMiddleware(deps.tokenService);
  console.log("Auth middleware created:", !!authMiddleware);

  const routes = buildRoutes(deps, authMiddleware);
  app.use(routes);

  app.use((_req, res) => res.status(404).json({ error: "Not Found" }));

  return { app };
}
