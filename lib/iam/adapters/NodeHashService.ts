import * as crypto from "node:crypto";
import * as bcrypt from "bcrypt";
import type { HashService } from "../ports/HashService";
import type { NewPassword } from "../domain/value-objects/NewPassword";

export class NodeHashService implements HashService {
  private readonly saltRounds = 12;

  async hash(password: NewPassword): Promise<string> {
    return bcrypt.hash(password.getValue(), this.saltRounds);
  }

  async verify(password: string, hashedPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch {
      return false;
    }
  }

  async randomUUID(): Promise<string> {
    return crypto.randomUUID();
  }
}
