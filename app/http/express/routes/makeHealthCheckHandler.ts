import type { RequestHandlerFactory } from "../contracts/RequestHandlerFactory";

export const makeHealthCheckHandler: RequestHandlerFactory =
  () => (_req, res) =>
    res.status(200).json({ ok: true });
