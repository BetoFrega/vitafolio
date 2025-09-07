export interface HashService {
  hash: (password: string) => Promise<string>;
  makeSalt: () => Promise<string>;
}
