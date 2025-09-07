import { makeExpressApp } from "app/http/express/makeExpressApp";
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
      await supertest(app)
        .post("/register")
        .send({ email: "test@example.com", password: "password" })
        .expect(201);

      expect(deps.registerAccount).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password",
      });
    });
  });
});
