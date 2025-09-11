import type { Request, Response, NextFunction } from "express";
import type { ListNotifications } from "@collections/app/ListNotifications";

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
}

/**
 * Handler for GET /api/v1/notifications
 */
export function makeListNotificationsHandler(deps: {
  listNotifications: ListNotifications;
}) {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      // Check authentication
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Extract query parameters
      const { limit, offset } = req.query;

      // Build input object with proper optional property handling
      const input: Parameters<typeof deps.listNotifications.execute>[0] = {
        userId,
      };

      if (limit) input.limit = parseInt(limit as string, 10);
      if (offset) input.offset = parseInt(offset as string, 10);

      // Execute use case
      const result = await deps.listNotifications.execute(input);

      if (result.isFailure()) {
        const { message } = result.getError();
        return res.status(400).json({ error: message });
      }

      const notifications = result.getValue();
      return res.status(200).json({
        notifications: notifications.notifications.map((notification) => ({
          id: notification.id,
          type: notification.type,
          status: notification.status,
          itemId: notification.itemId,
          message: notification.message,
          scheduledFor: notification.scheduledFor.toISOString(),
          deliveredAt: notification.deliveredAt?.toISOString(),
          metadata: notification.metadata,
          createdAt: notification.createdAt.toISOString(),
        })),
        total: notifications.total,
      });
    } catch (error) {
      return next(error);
    }
  };
}
