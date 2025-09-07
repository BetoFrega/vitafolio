import type { Deps } from "../../../ports/Deps";
import express from "express";
import { makeUserRegistrationHandler } from "./makeUserRegistrationHandler";
import { makeHealthCheckHandler } from "./makeHealthCheckHandler";
import { makeLoginHandler } from "./makeLoginHandler";

export const buildRoutes = (deps: Deps) => {
  const router = express.Router();
  router.get("/health", makeHealthCheckHandler(deps));
  router.post("/register", makeUserRegistrationHandler(deps));
  router.post("/login", makeLoginHandler(deps));
  return router;
};
