import { makeExpressApp } from "app/http/express/makeExpressApp";
import { Result } from "lib/shared/app/contracts/Result";
import supertest from "supertest";
import Express from "express";
import type { RegisterAccountDeps } from "app/ports/Deps";

describe("Identity and Access Management", () => {
  let app: Express.Application;
  let deps: RegisterAccountDeps;
  beforeEach(() => {
    deps = { registerAccount: vi.fn() };
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
});
