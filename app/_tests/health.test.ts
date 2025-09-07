import { makeExpressApp } from "app/http/express/makeExpressApp";
import supertest from "supertest";
import Express from "express";
import type { Deps } from "app/ports/Deps";

describe("Service Health", () => {
  let app: Express.Application;
  let deps: Deps;
  beforeEach(() => {
    deps = {} as Deps;
    ({ app } = makeExpressApp(deps));
  });

  describe("/health - Health check", () => {
    it("should return 200 OK", async () => {
      await supertest(app).get("/health").expect(200);
    });
  });
});
