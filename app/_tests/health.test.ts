import { makeExpressApp } from "app/http/express/makeExpressApp";
import supertest from "supertest";
import Express from "express";

describe("Service Health", () => {
  let app: Express.Application;
  beforeEach(() => {
    ({ app } = makeExpressApp({ registerAccount: async () => {} }));
  });

  describe("/health - Health check", () => {
    it("should return 200 OK", async () => {
      await supertest(app).get("/health").expect(200);
    });
  });
});
