import { User } from "../domain/aggregates/User";
import type { UserRepository } from "../ports/UserRepository";

interface StoredUser {
  id: string;
  email: string;
  hashedPassword: string;
  createdAt: Date;
}

export class InMemoryUserRepository implements UserRepository {
  private users = new Map<string, StoredUser>();

  async createUser(user: User): Promise<void> {
    if (this.users.has(user.data.id)) {
      throw new Error(`User with id ${user.data.id} already exists`);
    }

    for (const userData of this.users.values()) {
      if (userData.email === user.data.email) {
        throw new Error(`User with email ${user.data.email} already exists`);
      }
    }

    this.users.set(user.data.id, {
      id: user.data.id,
      email: user.data.email,
      hashedPassword: user.data.hashedPassword,
      createdAt: user.data.createdAt,
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
