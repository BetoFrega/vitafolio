import { User } from "../aggregates/User";

export interface UserRepository {
  save(user: User): Promise<void>;
}
