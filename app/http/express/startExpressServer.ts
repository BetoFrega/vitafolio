import express from "express";
import { buildRoutes } from "./routes";
import type { Deps } from "../../ports/Deps";

export function startExpressServer(deps: Deps) {
  const app = express();
  app.use(express.json());

  app.get("/health", (_req, res) => res.status(200).json({ ok: true }));

  app.use(buildRoutes(deps));

  app.use((_req, res) => res.status(404).json({ error: "Not Found" }));

  app.listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
  });
}
