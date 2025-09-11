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
      const result = await deps.registerAccount.execute({ email, password });

      if (result.isSuccess()) {
        res.status(201).json({ message: "Account registered successfully" });
      } else {
        res.status(400).json({ error: result.getError().message });
      }
    } catch (error) {
      next(error);
    }
  };
};
