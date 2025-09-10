import type { Request, Response, NextFunction } from "express";
import type { TokenService } from "@iam/ports/TokenService";

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
}

export function makeAuthenticationMiddleware(tokenService: TokenService) {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
          },
          timestamp: new Date().toISOString(),
        });
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix

      const verifyResult = await tokenService.verify(token);

      if (!verifyResult.success) {
        return res.status(401).json({
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Invalid or expired token",
          },
          timestamp: new Date().toISOString(),
        });
      }

      // Set user information on request object
      req.user = {
        id: verifyResult.data.userId,
      };

      next();
    } catch {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication failed",
        },
        timestamp: new Date().toISOString(),
      });
    }
  };
}
