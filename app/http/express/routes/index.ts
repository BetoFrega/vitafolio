import type { Deps } from "../../../ports/Deps";
import express from "express";
import { makeUserRegistrationHandler } from "./makeUserRegistrationHandler";

export const buildRoutes = (deps: Deps) => {
  const router = express.Router();
  router.post("/register", makeUserRegistrationHandler(deps));
  return router;
};
