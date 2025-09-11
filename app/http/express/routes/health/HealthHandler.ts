import type { Request, Response } from "express";
import { BaseHandler } from "../shared/handlers/BaseHandler";

/**
 * Health check data returned by the health endpoint
 */
interface HealthData {
  ok: true;
}

/**
 * Handler for health check endpoint
 *
 * Returns a simple health status following the new standardized response format.
 * This maintains compatibility with the existing health check behavior while
 * adopting the new architecture patterns.
 */
export class HealthHandler extends BaseHandler<HealthData> {
  async handle(req: Request, res: Response): Promise<void> {
    const healthData: HealthData = { ok: true };
    this.sendSuccess(res, healthData, 200);
  }
}
