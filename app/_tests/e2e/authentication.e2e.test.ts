import supertest from "supertest";
import {
  setupE2ETest,
  setupMultiUserE2ETest,
  createTestCollection,
  type E2ETestContext,
  type MultiUserE2ETestContext,
} from "../helpers/e2e-setup";
import { TestDataBuilder } from "../helpers/test-data-builders";

describe.skip("Authentication E2E Tests", () => {
  let context: E2ETestContext;

  beforeEach(async () => {
    context = await setupE2ETest();
  });

  describe("Token Management", () => {
    it("should handle malformed tokens", async () => {
      // Test with various invalid token formats
      const invalidTokens = [
        "invalid_token",
        "Bearer",
        "Bearer ",
        "Bearer invalid_token_format",
        "NotBearer valid_looking_token",
        "",
      ];

      for (const token of invalidTokens) {
        const response = await supertest(context.app)
          .get("/api/v1/collections")
          .set("Authorization", token)
          .expect(401);

        expect(response.body.success).toBe(false);
      }
    });

    it("should handle missing authorization header", async () => {
      const response = await supertest(context.app)
        .get("/api/v1/collections")
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it("should maintain session across multiple requests", async () => {
      // Perform multiple authenticated operations with same token
      const operations = [
        () =>
          supertest(context.app)
            .get("/api/v1/collections")
            .set("Authorization", `Bearer ${context.accessToken}`)
            .expect(200),

        () =>
          supertest(context.app)
            .post("/api/v1/collections")
            .set("Authorization", `Bearer ${context.accessToken}`)
            .send(TestDataBuilder.collection())
            .expect(201),

        () =>
          supertest(context.app)
            .get("/api/v1/collections")
            .set("Authorization", `Bearer ${context.accessToken}`)
            .expect(200),

        () =>
          supertest(context.app)
            .get("/api/v1/notifications")
            .set("Authorization", `Bearer ${context.accessToken}`)
            .expect(200),
      ];

      // Execute all operations sequentially
      for (const operation of operations) {
        const response = await operation();
        expect(response.body.success).toBe(true);
      }
    });
  });

  describe("Complete Authentication Flows", () => {
    it("should handle complete user registration and verification", async () => {
      // Test registration with various valid inputs
      const validUsers = [
        {
          email: "user1@example.com",
          password: "Password123!",
          confirmPassword: "Password123!",
        },
        {
          email: "test.user+tag@domain.co.uk",
          password: "AnotherPassword456@",
          confirmPassword: "AnotherPassword456@",
        },
        {
          email: "simple@test.com",
          password: "Simple123",
          confirmPassword: "Simple123",
        },
      ];

      for (const userData of validUsers) {
        const response = await supertest(context.app)
          .post("/register")
          .send(userData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toMatchObject({
          id: expect.any(String),
          email: userData.email,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        });
      }
    });

    it("should handle password confirmation validation", async () => {
      const userData = {
        email: "test@example.com",
        password: "Password123!",
        confirmPassword: "DifferentPassword123!", // Mismatch
      };

      const response = await supertest(context.app)
        .post("/register")
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it("should handle duplicate email registration", async () => {
      const userData = {
        email: "duplicate@example.com",
        password: "Password123!",
        confirmPassword: "Password123!",
      };

      // First registration should succeed
      await supertest(context.app).post("/register").send(userData).expect(201);

      // Second registration with same email should fail
      const response = await supertest(context.app)
        .post("/register")
        .send(userData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it("should handle login with various scenarios", async () => {
      // Register a user first
      const userData = {
        email: "login.test@example.com",
        password: "LoginTest123!",
        confirmPassword: "LoginTest123!",
      };

      await supertest(context.app).post("/register").send(userData).expect(201);

      // Test valid credentials
      const validLoginResponse = await supertest(context.app)
        .post("/login")
        .send({
          email: userData.email,
          password: userData.password,
        })
        .expect(200);

      expect(validLoginResponse.body.success).toBe(true);
      expect(validLoginResponse.body.accessToken).toBeDefined();

      // Test invalid email
      await supertest(context.app)
        .post("/login")
        .send({
          email: "nonexistent@example.com",
          password: userData.password,
        })
        .expect(401);

      // Test invalid password
      await supertest(context.app)
        .post("/login")
        .send({
          email: userData.email,
          password: "WrongPassword123!",
        })
        .expect(401);

      // Test non-existent user
      await supertest(context.app)
        .post("/login")
        .send({
          email: "totally.fake@example.com",
          password: "SomePassword123!",
        })
        .expect(401);
    });
  });

  describe("Input Validation for Authentication", () => {
    it("should validate registration input", async () => {
      const invalidInputs = [
        {
          // Missing email
          password: "Password123!",
          confirmPassword: "Password123!",
        },
        {
          // Missing password
          email: "test@example.com",
          confirmPassword: "Password123!",
        },
        {
          // Missing confirmPassword
          email: "test@example.com",
          password: "Password123!",
        },
        {
          // Invalid email format
          email: "not-an-email",
          password: "Password123!",
          confirmPassword: "Password123!",
        },
        {
          // Empty fields
          email: "",
          password: "",
          confirmPassword: "",
        },
      ];

      for (const invalidInput of invalidInputs) {
        const response = await supertest(context.app)
          .post("/register")
          .send(invalidInput)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBeDefined();
      }
    });

    it("should validate login input", async () => {
      const invalidInputs = [
        {
          // Missing email
          password: "Password123!",
        },
        {
          // Missing password
          email: "test@example.com",
        },
        {
          // Empty fields
          email: "",
          password: "",
        },
        {
          // Invalid email format
          email: "not-an-email",
          password: "Password123!",
        },
      ];

      for (const invalidInput of invalidInputs) {
        const response = await supertest(context.app)
          .post("/login")
          .send(invalidInput)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBeDefined();
      }
    });
  });
});

describe.skip("User Data Isolation E2E Tests", () => {
  let context: MultiUserE2ETestContext;

  beforeEach(async () => {
    context = await setupMultiUserE2ETest();
  });

  describe("User Isolation", () => {
    it("should isolate collections between users", async () => {
      // User A creates collections
      await createTestCollection(
        context.app,
        context.userA.accessToken,
        TestDataBuilder.collection({ name: "User A Collection 1" }),
      );

      await createTestCollection(
        context.app,
        context.userA.accessToken,
        TestDataBuilder.collection({ name: "User A Collection 2" }),
      );

      // User B creates collections
      await createTestCollection(
        context.app,
        context.userB.accessToken,
        TestDataBuilder.collection({ name: "User B Collection 1" }),
      );

      // User B should only see their own collections
      const userBCollectionsResponse = await supertest(context.app)
        .get("/api/v1/collections")
        .set("Authorization", `Bearer ${context.userB.accessToken}`)
        .expect(200);

      expect(userBCollectionsResponse.body.success).toBe(true);
      expect(userBCollectionsResponse.body.data.collections).toHaveLength(1);
      expect(userBCollectionsResponse.body.data.collections[0].name).toBe(
        "User B Collection 1",
      );

      // User A should only see their own collections
      const userACollectionsResponse = await supertest(context.app)
        .get("/api/v1/collections")
        .set("Authorization", `Bearer ${context.userA.accessToken}`)
        .expect(200);

      expect(userACollectionsResponse.body.success).toBe(true);
      expect(userACollectionsResponse.body.data.collections).toHaveLength(2);

      const userACollectionNames =
        userACollectionsResponse.body.data.collections.map(
          (c: { name: string }) => c.name,
        );
      expect(userACollectionNames).toContain("User A Collection 1");
      expect(userACollectionNames).toContain("User A Collection 2");
    });

    it("should prevent cross-user data access", async () => {
      // User A creates a collection
      const { collectionId } = await createTestCollection(
        context.app,
        context.userA.accessToken,
        TestDataBuilder.collection({ name: "User A Private Collection" }),
      );

      // User B tries to access User A's collection
      const response = await supertest(context.app)
        .get(`/api/v1/collections/${collectionId}`)
        .set("Authorization", `Bearer ${context.userB.accessToken}`)
        .expect(404); // Should not find it since it doesn't belong to User B

      expect(response.body.success).toBe(false);
    });

    it("should prevent cross-user data modification", async () => {
      // User A creates a collection
      const { collectionId } = await createTestCollection(
        context.app,
        context.userA.accessToken,
        TestDataBuilder.collection({ name: "User A Collection" }),
      );

      // User B tries to modify User A's collection
      const updateResponse = await supertest(context.app)
        .put(`/api/v1/collections/${collectionId}`)
        .set("Authorization", `Bearer ${context.userB.accessToken}`)
        .send({
          name: "Hacked Collection Name",
          description: "Hacked by User B",
        })
        .expect(404); // Should not find it since it doesn't belong to User B

      expect(updateResponse.body.success).toBe(false);

      // User B tries to delete User A's collection
      const deleteResponse = await supertest(context.app)
        .delete(`/api/v1/collections/${collectionId}`)
        .set("Authorization", `Bearer ${context.userB.accessToken}`)
        .expect(404); // Should not find it since it doesn't belong to User B

      expect(deleteResponse.body.success).toBe(false);

      // Verify User A's collection is still intact
      const getResponse = await supertest(context.app)
        .get(`/api/v1/collections/${collectionId}`)
        .set("Authorization", `Bearer ${context.userA.accessToken}`)
        .expect(200);

      expect(getResponse.body.success).toBe(true);
      expect(getResponse.body.data.name).toBe("User A Collection");
    });

    it("should isolate notifications between users", async () => {
      // User A creates collection and items, then deletes items to generate notifications
      const { collectionId } = await createTestCollection(
        context.app,
        context.userA.accessToken,
        TestDataBuilder.bookCollection({ name: "User A Books" }),
      );

      // User A creates and deletes an item to generate notification
      const createResponse = await supertest(context.app)
        .post(`/api/v1/collections/${collectionId}/items`)
        .set("Authorization", `Bearer ${context.userA.accessToken}`)
        .send(TestDataBuilder.book({ name: "User A Book" }))
        .expect(201);

      const itemId = createResponse.body.data.id;

      await supertest(context.app)
        .delete(`/api/v1/items/${itemId}`)
        .set("Authorization", `Bearer ${context.userA.accessToken}`)
        .expect(200);

      // User A should see their notification
      const userANotificationsResponse = await supertest(context.app)
        .get("/api/v1/notifications")
        .set("Authorization", `Bearer ${context.userA.accessToken}`)
        .expect(200);

      expect(userANotificationsResponse.body.success).toBe(true);
      expect(userANotificationsResponse.body.data.notifications).toHaveLength(
        1,
      );

      // User B should not see User A's notifications
      const userBNotificationsResponse = await supertest(context.app)
        .get("/api/v1/notifications")
        .set("Authorization", `Bearer ${context.userB.accessToken}`)
        .expect(200);

      expect(userBNotificationsResponse.body.success).toBe(true);
      expect(userBNotificationsResponse.body.data.notifications).toHaveLength(
        0,
      );
    });
  });
});
