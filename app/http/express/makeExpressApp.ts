import express from "express";
import { buildRoutes } from "./routes";
import type { Deps } from "../../ports/Deps";

export function makeExpressApp(deps: Deps) {
  const app = express();
  app.use(express.json());

  app.get("/health", (_req, res) => res.status(200).json({ ok: true }));

  app.use(buildRoutes(deps));

  app.use((_req, res) => res.status(404).json({ error: "Not Found" }));

  return { app };
}
