export interface UserRepository {
  createUser: (
    email: string,
    passwordHash: string,
    salt: string,
  ) => Promise<void>;
}
