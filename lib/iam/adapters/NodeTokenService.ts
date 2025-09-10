import jwt from "jsonwebtoken";
import { randomBytes } from "node:crypto";
import type { TokenService } from "../ports/TokenService";

export class NodeTokenService implements TokenService {
  private readonly jwtSecret: string;

  constructor() {
    // In a real application, this should come from environment variables
    // For now, using a default for development
    this.jwtSecret =
      process.env.JWT_SECRET || "your-secret-key-change-this-in-production";
  }

  async generateAccessToken(payload: { userId: string }): Promise<string> {
    try {
      // Short-lived access token (15 minutes)
      const token = jwt.sign(
        {
          userId: payload.userId,
          type: "access",
          nonce: randomBytes(16).toString("hex"), // Add randomness to ensure uniqueness
        },
        this.jwtSecret,
        { expiresIn: 900 }, // 15 minutes in seconds
      );
      return token;
    } catch {
      throw new Error("Failed to generate access token");
    }
  }

  async generateRefreshToken(payload: { userId: string }): Promise<string> {
    try {
      // Long-lived refresh token (7 days)
      const token = jwt.sign(
        {
          userId: payload.userId,
          type: "refresh",
          nonce: randomBytes(16).toString("hex"), // Add randomness to ensure uniqueness
        },
        this.jwtSecret,
        { expiresIn: 604800 }, // 7 days in seconds
      );
      return token;
    } catch {
      throw new Error("Failed to generate refresh token");
    }
  }

  async verify(
    token: string,
  ): Promise<
    | { success: true; data: { userId: string } }
    | { success: false; error: string }
  > {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as jwt.JwtPayload & {
        userId: string;
        type: string;
      };

      // Check if it's an access token
      if (decoded.type !== "access") {
        return { success: false, error: "Invalid token type" };
      }

      return {
        success: true,
        data: { userId: decoded.userId },
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return { success: false, error: "Token expired" };
      } else if (error instanceof jwt.JsonWebTokenError) {
        return { success: false, error: "Invalid token" };
      } else {
        return { success: false, error: "Token verification failed" };
      }
    }
  }
}
