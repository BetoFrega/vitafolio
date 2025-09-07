import type Express from "express";

// Allow handlers to declare a narrower dependency subset via a generic.
export type RequestHandlerFactory<LocalDeps = unknown> = (
  deps: LocalDeps,
) => Express.RequestHandler;
