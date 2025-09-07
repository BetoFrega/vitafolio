import type { LoginDeps } from "app/ports/Deps";
import Express from "express";
import type { RequestHandlerFactory } from "../contracts/RequestHandlerFactory";

export const makeLoginHandler: RequestHandlerFactory<LoginDeps> = (
  deps: LoginDeps,
) => {
  return async (
    req: Express.Request,
    res: Express.Response,
    next: Express.NextFunction,
  ) => {
    const { email, password } = req.body;
    try {
      const result = await deps.login({ email, password });

      if (result.isSuccess()) {
        res.status(200).json(result.getValue());
      } else {
        res.status(401).json({ error: result.getError().message });
      }
    } catch (error) {
      next(error);
    }
  };
};
