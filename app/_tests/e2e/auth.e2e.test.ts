import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { setupE2ETest, type E2ETestContext } from "../helpers/e2e-setup";
import { TestDataBuilder } from "../helpers/test-data-builders";
import type { Application } from "express";

describe("Auth E2E Tests", () => {
  let app: Application;
  let context: E2ETestContext;

  beforeEach(async () => {
    context = await setupE2ETest();
    app = context.app;
  });

  describe("POST /register", () => {
    it("should register a new user with standardized response format", async () => {
      const userData = TestDataBuilder.user();

      const response = await request(app)
        .post("/register")
        .send(userData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          message: expect.any(String),
        },
        timestamp: expect.any(String),
      });

      // Verify timestamp is a valid ISO string
      expect(response.body.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );
    });

    it("should return validation error for invalid data with standardized format", async () => {
      const invalidData = {
        email: "invalid-email",
        password: "123", // too short
      };

      const response = await request(app)
        .post("/register")
        .send(invalidData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: expect.any(String),
          message: expect.any(String),
        },
        timestamp: expect.any(String),
      });
    });

    it("should return conflict error for existing email with standardized format", async () => {
      const userData = TestDataBuilder.user();

      // Register first user
      await request(app).post("/register").send(userData).expect(201);

      // Try to register same email again
      const response = await request(app)
        .post("/register")
        .send(userData)
        .expect(409);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: "USER_ALREADY_EXISTS",
          message: expect.any(String),
        },
        timestamp: expect.any(String),
      });
    });

    it("should return JSON content type", async () => {
      const userData = TestDataBuilder.user();

      const response = await request(app).post("/register").send(userData);

      expect(response.headers["content-type"]).toMatch(/application\/json/);
    });
  });

  describe("POST /login", () => {
    it("should login user with valid credentials and standardized response format", async () => {
      const userData = TestDataBuilder.user();

      // Register user first
      await request(app).post("/register").send(userData).expect(201);

      // Login with same credentials
      const response = await request(app)
        .post("/login")
        .send({
          email: userData.email,
          password: userData.password,
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          token: expect.any(String),
        },
        timestamp: expect.any(String),
      });

      // Verify token is a valid JWT format (simplified check)
      expect(response.body.data.token).toMatch(
        /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/,
      );
    });

    it("should return authentication error for invalid credentials with standardized format", async () => {
      const response = await request(app)
        .post("/login")
        .send({
          email: "nonexistent@example.com",
          password: "wrongpassword",
        })
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: "AUTHENTICATION_FAILED",
          message: expect.any(String),
        },
        timestamp: expect.any(String),
      });
    });

    it("should return validation error for invalid email format with standardized format", async () => {
      const response = await request(app)
        .post("/login")
        .send({
          email: "invalid-email",
          password: "somepassword",
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: expect.any(String),
          message: expect.any(String),
        },
        timestamp: expect.any(String),
      });
    });

    it("should return JSON content type", async () => {
      const userData = TestDataBuilder.user();

      const response = await request(app).post("/login").send({
        email: userData.email,
        password: userData.password,
      });

      expect(response.headers["content-type"]).toMatch(/application\/json/);
    });
  });

  describe("GET /debug/auth", () => {
    it("should return authenticated user info with standardized response format", async () => {
      const userData = TestDataBuilder.user();

      // Register and login to get token
      await request(app).post("/register").send(userData).expect(201);

      const loginResponse = await request(app)
        .post("/login")
        .send({
          email: userData.email,
          password: userData.password,
        })
        .expect(200);

      const token = loginResponse.body.data.token;

      // Access debug endpoint with token
      const response = await request(app)
        .get("/debug/auth")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          message: "Authentication working",
          user: {
            id: expect.any(String),
            // Note: email field is not available in token payload, so it's omitted
          },
          middlewarePresent: true,
        },
        timestamp: expect.any(String),
      });
    });

    it("should return unauthorized error without token with standardized format", async () => {
      const response = await request(app).get("/debug/auth").expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: expect.any(String),
        },
        timestamp: expect.any(String),
      });
    });

    it("should return unauthorized error with invalid token with standardized format", async () => {
      const response = await request(app)
        .get("/debug/auth")
        .set("Authorization", "Bearer invalid_token")
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: expect.any(String),
        },
        timestamp: expect.any(String),
      });
    });

    it("should return JSON content type", async () => {
      const userData = TestDataBuilder.user();

      // Register and login to get token
      await request(app).post("/register").send(userData).expect(201);

      const loginResponse = await request(app).post("/login").send({
        email: userData.email,
        password: userData.password,
      });

      const token = loginResponse.body.data.token;

      const response = await request(app)
        .get("/debug/auth")
        .set("Authorization", `Bearer ${token}`);

      expect(response.headers["content-type"]).toMatch(/application\/json/);
    });
  });
});
