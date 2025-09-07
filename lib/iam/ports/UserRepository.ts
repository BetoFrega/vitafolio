import type { User } from "../domain/User";

export interface UserRepository {
  createUser: (user: User) => Promise<void>;
  findByEmail: (email: string) => Promise<User | null>;
  findById: (id: string) => Promise<User | null>;
}
