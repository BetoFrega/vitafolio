import type { Deps } from "app/ports/Deps";
import type Express from "express";

export type RequestHandlerFactory = (deps: Deps) => Express.RequestHandler;
