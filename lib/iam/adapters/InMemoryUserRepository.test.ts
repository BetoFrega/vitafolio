import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryUserRepository } from "./InMemoryUserRepository";
import { User } from "../domain/User";

describe(InMemoryUserRepository, () => {
  let repository: InMemoryUserRepository;

  beforeEach(() => {
    repository = new InMemoryUserRepository();
  });

  describe("createUser", () => {
    it("should create a user successfully", async () => {
      const user = User.create({
        id: "user-123",
        email: "john@example.com",
        hashedPassword: "hashed-password",
      });

      await repository.createUser(user);

      const foundUser = await repository.findById("user-123");
      expect(foundUser).not.toBeNull();
      expect(foundUser!.data.email).toBe("john@example.com");
      expect(foundUser!.data.hashedPassword).toBe("hashed-password");
    });

    it("should throw error when creating user with duplicate id", async () => {
      const user1 = User.create({
        id: "user-123",
        email: "john@example.com",
        hashedPassword: "hashed-password",
      });

      const user2 = User.create({
        id: "user-123",
        email: "different@example.com",
        hashedPassword: "hashed-password",
      });

      await repository.createUser(user1);

      await expect(repository.createUser(user2)).rejects.toThrow(
        "User with id user-123 already exists",
      );
    });

    it("should throw error when creating user with duplicate email", async () => {
      const user1 = User.create({
        id: "user-123",
        email: "john@example.com",
        hashedPassword: "hashed-password",
      });

      const user2 = User.create({
        id: "user-456",
        email: "john@example.com",
        hashedPassword: "different-hash",
      });

      await repository.createUser(user1);

      await expect(repository.createUser(user2)).rejects.toThrow(
        "User with email john@example.com already exists",
      );
    });
  });

  describe("findById", () => {
    it("should return user when found", async () => {
      const user = User.create({
        id: "user-123",
        email: "john@example.com",
        hashedPassword: "hashed-password",
      });

      await repository.createUser(user);
      const foundUser = await repository.findById("user-123");

      expect(foundUser).not.toBeNull();
      expect(foundUser!.data.id).toBe("user-123");
      expect(foundUser!.data.email).toBe("john@example.com");
    });

    it("should return null when user not found", async () => {
      const user = await repository.findById("non-existent");
      expect(user).toBeNull();
    });
  });

  describe("findByEmail", () => {
    it("should return user when found", async () => {
      const user = User.create({
        id: "user-123",
        email: "john@example.com",
        hashedPassword: "hashed-password",
      });

      await repository.createUser(user);
      const foundUser = await repository.findByEmail("john@example.com");

      expect(foundUser).not.toBeNull();
      expect(foundUser!.data.id).toBe("user-123");
      expect(foundUser!.data.email).toBe("john@example.com");
    });

    it("should return null when user not found", async () => {
      const user = await repository.findByEmail("nonexistent@example.com");
      expect(user).toBeNull();
    });
  });

  describe("helper methods", () => {
    it("should clear all users", async () => {
      const user = User.create({
        id: "user-1",
        email: "user1@example.com",
        hashedPassword: "hash1",
      });

      await repository.createUser(user);

      expect(repository.size()).toBe(1);
      repository.clear();
      expect(repository.size()).toBe(0);
    });

    it("should return correct size", async () => {
      expect(repository.size()).toBe(0);

      const user1 = User.create({
        id: "user-1",
        email: "user1@example.com",
        hashedPassword: "hash1",
      });

      await repository.createUser(user1);
      expect(repository.size()).toBe(1);

      const user2 = User.create({
        id: "user-2",
        email: "user2@example.com",
        hashedPassword: "hash2",
      });

      await repository.createUser(user2);
      expect(repository.size()).toBe(2);
    });
  });
});
