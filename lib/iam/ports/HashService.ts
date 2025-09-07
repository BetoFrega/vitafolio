export interface HashService {
  hash: (password: string) => Promise<string>;
  verify: (password: string, hashedPassword: string) => Promise<boolean>;
  randomUUID: () => Promise<string>;
}
