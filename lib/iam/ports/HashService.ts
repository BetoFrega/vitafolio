export interface HashService {
  hash: (password: string) => Promise<string>;
  verify: (password: string, hashedPassword: string) => Promise<boolean>;
  makeSalt: () => Promise<string>;
  randomUUID: () => Promise<string>;
}
