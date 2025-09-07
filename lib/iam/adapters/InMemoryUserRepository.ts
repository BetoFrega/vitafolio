import { User } from "../domain/User";
import type { CreateUserData, UserRepository } from "../ports/UserRepository";

interface StoredUser {
  id: string;
  email: string;
  hashedPassword: string;
  createdAt: Date;
}

export class InMemoryUserRepository implements UserRepository {
  private users = new Map<string, StoredUser>();

  async createUser(data: CreateUserData): Promise<void> {
    if (this.users.has(data.id)) {
      throw new Error(`User with id ${data.id} already exists`);
    }

    for (const user of this.users.values()) {
      if (user.email === data.email) {
        throw new Error(`User with email ${data.email} already exists`);
      }
    }

    this.users.set(data.id, {
      ...data,
      createdAt: new Date(),
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    for (const userData of this.users.values()) {
      if (userData.email === email) {
        return User.fromData(userData);
      }
    }
    return null;
  }

  async findById(id: string): Promise<User | null> {
    const userData = this.users.get(id);
    if (!userData) {
      return null;
    }
    return User.fromData(userData);
  }

  // Helper methods for testing
  clear(): void {
    this.users.clear();
  }

  size(): number {
    return this.users.size;
  }
}
