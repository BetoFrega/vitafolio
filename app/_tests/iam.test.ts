import { makeExpressApp } from "app/http/express/makeExpressApp";
import supertest from "supertest";
import Express from "express";
describe("Identity and Access Management", () => {
  let app: Express.Application;
  beforeEach(() => {
    ({ app } = makeExpressApp({ registerAccount: async () => {} }));
  });

  describe("/register - User Registration", () => {
    it("should register a new user successfully", async () => {
      supertest(app)
        .post("/register")
        .send({ email: "test@example.com", password: "password" })
        .expect(201);
    });
  });
});
