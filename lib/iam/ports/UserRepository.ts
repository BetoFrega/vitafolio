import type { User } from "../domain/User";

export interface CreateUserData {
  id: string;
  email: string;
  hashedPassword: string;
}

export interface UserRepository {
  createUser: (data: CreateUserData) => Promise<void>;
  findByEmail: (email: string) => Promise<User | null>;
  findById: (id: string) => Promise<User | null>;
}
