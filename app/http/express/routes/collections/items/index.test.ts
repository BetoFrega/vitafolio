import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import { buildItemsRouter } from "./index";
import { Result } from "@shared/app/contracts/Result";

// Mock all the use cases
const mockDeps = {
  addItemToCollection: {
    execute: vi.fn(),
  },
  getItem: {
    execute: vi.fn(),
  },
  updateItem: {
    execute: vi.fn(),
  },
  deleteItem: {
    execute: vi.fn(),
  },
  listItems: {
    execute: vi.fn(),
  },
  searchItems: {
    execute: vi.fn(),
  },
};

// Mock authentication middleware
const mockAuthMiddleware = (req: any, res: any, next: any) => {
  req.user = { id: "user123" };
  next();
};

describe("Items Router", () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(mockAuthMiddleware);

    const itemsRouter = buildItemsRouter(mockDeps);
    app.use("/api/v1", itemsRouter);

    // Clear all mocks
    Object.values(mockDeps).forEach((dep) => {
      vi.clearAllMocks();
    });
  });

  describe("POST /api/v1/collections/:collectionId/items", () => {
    it("should create item successfully", async () => {
      // Arrange
      const itemData = {
        id: "item123",
        name: "Test Item",
        collectionId: "collection123",
        metadata: { type: "test" },
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z"),
      };
      mockDeps.addItemToCollection.execute.mockResolvedValue(
        Result.success(itemData),
      );

      // Act
      const response = await request(app)
        .post("/api/v1/collections/collection123/items")
        .send({
          name: "Test Item",
          metadata: { type: "test" },
        });

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe("item123");
    });
  });

  describe("GET /api/v1/collections/:collectionId/items", () => {
    it("should list items successfully", async () => {
      // Arrange
      const listData = {
        items: [
          {
            id: "item1",
            name: "Item 1",
            collectionId: "collection123",
            metadata: {},
            createdAt: new Date("2024-01-01T00:00:00Z"),
            updatedAt: new Date("2024-01-01T00:00:00Z"),
          },
        ],
        total: 1,
      };
      mockDeps.listItems.execute.mockResolvedValue(Result.success(listData));

      // Act
      const response = await request(app).get(
        "/api/v1/collections/collection123/items",
      );

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.total).toBe(1);
    });
  });

  describe("GET /api/v1/items/:id", () => {
    it("should get item successfully", async () => {
      // Arrange
      const itemData = {
        id: "item123",
        name: "Test Item",
        collectionId: "collection123",
        metadata: { type: "test" },
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z"),
      };
      mockDeps.getItem.execute.mockResolvedValue(Result.success(itemData));

      // Act
      const response = await request(app).get("/api/v1/items/item123");

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe("item123");
    });
  });

  describe("PUT /api/v1/items/:id", () => {
    it("should update item successfully", async () => {
      // Arrange
      const itemData = {
        id: "item123",
        name: "Updated Item",
        collectionId: "collection123",
        metadata: { type: "updated" },
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T01:00:00Z"),
      };
      mockDeps.updateItem.execute.mockResolvedValue(Result.success(itemData));

      // Act
      const response = await request(app)
        .put("/api/v1/items/item123")
        .send({
          name: "Updated Item",
          metadata: { type: "updated" },
        });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe("Updated Item");
    });
  });

  describe("DELETE /api/v1/items/:id", () => {
    it("should delete item successfully", async () => {
      // Arrange
      mockDeps.deleteItem.execute.mockResolvedValue(Result.success(undefined));

      // Act
      const response = await request(app).delete("/api/v1/items/item123");

      // Assert
      expect(response.status).toBe(204);
    });
  });

  describe("GET /api/v1/items/search", () => {
    it("should search items successfully", async () => {
      // Arrange
      const searchData = {
        items: [
          {
            id: "item1",
            name: "Matching Item",
            collectionId: "collection123",
            metadata: { type: "test" },
            createdAt: new Date("2024-01-01T00:00:00Z"),
            updatedAt: new Date("2024-01-01T00:00:00Z"),
          },
        ],
        total: 1,
      };
      mockDeps.searchItems.execute.mockResolvedValue(
        Result.success(searchData),
      );

      // Act
      const response = await request(app).get(
        "/api/v1/items/search?query=test&limit=10",
      );

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.total).toBe(1);
    });
  });
});
