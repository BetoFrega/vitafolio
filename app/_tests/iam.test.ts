import { makeExpressApp } from "app/http/express/makeExpressApp";
import { Result } from "lib/shared/app/contracts/Result";
import supertest from "supertest";
import Express from "express";
import type { Deps } from "app/ports/Deps";

describe("Identity and Access Management", () => {
  let app: Express.Application;
  let deps: Deps;
  beforeEach(() => {
    deps = {
      registerAccount: vi.fn(),
      login: vi.fn(),
      // Placeholder repositories for collections (not used in IAM tests)
      collectionRepository: {},
      itemRepository: {},
      notificationRepository: {},
    };
    ({ app } = makeExpressApp(deps));
  });

  describe("/register - User Registration", () => {
    it("should register a new user successfully", async () => {
      deps.registerAccount = vi
        .fn()
        .mockResolvedValue(Result.success(undefined));

      await supertest(app)
        .post("/register")
        .send({ email: "test@example.com", password: "password" })
        .expect(201);

      expect(deps.registerAccount).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password",
      });
    });

    it("should return 400 when registration fails", async () => {
      deps.registerAccount = vi
        .fn()
        .mockResolvedValue(Result.failure(new Error("Registration failed")));

      await supertest(app)
        .post("/register")
        .send({ email: "test@example.com", password: "password" })
        .expect(400);

      expect(deps.registerAccount).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password",
      });
    });
  });

  describe("/login - User Login", () => {
    it("should login a user successfully", async () => {
      const mockTokens = {
        accessToken: "access-token",
        refreshToken: "refresh-token",
      };
      deps.login = vi.fn().mockResolvedValue(Result.success(mockTokens));

      await supertest(app)
        .post("/login")
        .send({ email: "test@example.com", password: "password" })
        .expect(200);

      expect(deps.login).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password",
      });
    });

    it("should return 401 when login fails", async () => {
      deps.login = vi
        .fn()
        .mockResolvedValue(Result.failure(new Error("Authentication failed")));

      await supertest(app)
        .post("/login")
        .send({ email: "test@example.com", password: "password" })
        .expect(401);

      expect(deps.login).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password",
      });
    });
  });
});
