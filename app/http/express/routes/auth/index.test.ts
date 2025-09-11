import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import express, {
  type Application,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { buildAuthRoutes } from "./index";
import type { RegisterAccountDeps, LoginDeps } from "app/ports/Deps";
import { Result } from "@shared/app/contracts/Result";

describe("Auth Routes Module", () => {
  let app: Application;
  let mockDeps: RegisterAccountDeps & LoginDeps;
  let mockAuthMiddleware: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Create mock dependencies
    mockDeps = {
      registerAccount: {
        execute: vi.fn(),
      } as unknown as RegisterAccountDeps["registerAccount"],
      login: {
        execute: vi.fn(),
      } as unknown as LoginDeps["login"],
    };

    // Create mock auth middleware
    mockAuthMiddleware = vi.fn(
      (req: Request, res: Response, next: NextFunction) => {
        (req as Request & { user?: { id: string } }).user = {
          id: "test-user-id",
        };
        next();
      },
    );

    // Create Express app with auth routes
    app = express();
    app.use(express.json());

    const authRouter = buildAuthRoutes(mockDeps, mockAuthMiddleware);
    app.use(authRouter);
  });

  describe("POST /register", () => {
    it("should handle registration request with new handler", async () => {
      // Arrange
      mockDeps.registerAccount.execute = vi
        .fn()
        .mockResolvedValue(Result.success(undefined));

      // Act
      const response = await request(app).post("/register").send({
        email: "test@example.com",
        password: "password123",
      });

      // Assert
      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        success: true,
        data: {
          message: "Account registered successfully",
        },
        timestamp: expect.any(String),
      });
      expect(mockDeps.registerAccount.execute).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
    });

    it("should return validation error for invalid data", async () => {
      // Act
      const response = await request(app).post("/register").send({
        email: "invalid-email",
        password: "123", // too short
      });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: expect.any(String),
        },
        timestamp: expect.any(String),
      });
    });
  });

  describe("POST /login", () => {
    it("should handle login request with new handler", async () => {
      // Arrange
      mockDeps.login.execute = vi.fn().mockResolvedValue(
        Result.success({
          accessToken: "test-access-token",
          refreshToken: "test-refresh-token",
        }),
      );

      // Act
      const response = await request(app).post("/login").send({
        email: "test@example.com",
        password: "password123",
      });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        data: {
          token: "test-access-token",
        },
        timestamp: expect.any(String),
      });
      expect(mockDeps.login.execute).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
    });

    it("should return authentication error for invalid credentials", async () => {
      // Arrange
      mockDeps.login.execute = vi
        .fn()
        .mockResolvedValue(Result.failure(new Error("Authentication failed")));

      // Act
      const response = await request(app).post("/login").send({
        email: "test@example.com",
        password: "wrongpassword",
      });

      // Assert
      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: "AUTHENTICATION_FAILED",
          message: "Authentication failed",
        },
        timestamp: expect.any(String),
      });
    });
  });

  describe("GET /debug/auth", () => {
    it("should handle debug auth request with new handler", async () => {
      // Act
      const response = await request(app)
        .get("/debug/auth")
        .set("Authorization", "Bearer test-token");

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        data: {
          message: "Authentication working",
          user: {
            id: "test-user-id",
            // Note: email field is omitted when undefined
          },
          middlewarePresent: true,
        },
        timestamp: expect.any(String),
      });
    });

    it("should require authentication", async () => {
      // Arrange - modify middleware to reject
      mockAuthMiddleware.mockImplementation((req: Request, res: Response) => {
        res.status(401).json({
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
          },
          timestamp: new Date().toISOString(),
        });
      });

      // Act
      const response = await request(app).get("/debug/auth");

      // Assert
      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
        timestamp: expect.any(String),
      });
    });
  });

  describe("content type headers", () => {
    it("should return JSON content type for all endpoints", async () => {
      // Test registration
      mockDeps.registerAccount.execute = vi
        .fn()
        .mockResolvedValue(Result.success(undefined));

      const registerResponse = await request(app)
        .post("/register")
        .send({ email: "test@example.com", password: "password123" });

      expect(registerResponse.headers["content-type"]).toMatch(
        /application\/json/,
      );

      // Test login
      mockDeps.login.execute = vi.fn().mockResolvedValue(
        Result.success({
          accessToken: "test-token",
          refreshToken: "test-refresh",
        }),
      );

      const loginResponse = await request(app)
        .post("/login")
        .send({ email: "test@example.com", password: "password123" });

      expect(loginResponse.headers["content-type"]).toMatch(
        /application\/json/,
      );

      // Test debug auth
      const debugResponse = await request(app)
        .get("/debug/auth")
        .set("Authorization", "Bearer test-token");

      expect(debugResponse.headers["content-type"]).toMatch(
        /application\/json/,
      );
    });
  });
});
