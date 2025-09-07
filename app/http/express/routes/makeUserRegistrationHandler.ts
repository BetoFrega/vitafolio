import type { RegisterAccountDeps } from "app/ports/Deps";
import Express from "express";
import type { RequestHandlerFactory } from "../contracts/RequestHandlerFactory";

export const makeUserRegistrationHandler: RequestHandlerFactory<
  RegisterAccountDeps
> = (deps: RegisterAccountDeps) => {
  return async (
    req: Express.Request,
    res: Express.Response,
    next: Express.NextFunction,
  ) => {
    const { email, password } = req.body;
    try {
      await deps.registerAccount({ email, password });
      res.status(201).json({ message: "Account registered successfully" });
    } catch (error) {
      next(error);
    }
  };
};
