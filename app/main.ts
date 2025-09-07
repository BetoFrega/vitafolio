import { RegisterAccount } from "lib/iam/app/RegisterAccount";
import { InMemoryUserRepository } from "lib/iam/adapters/InMemoryUserRepository";
import { makeExpressApp } from "./http/express/makeExpressApp";
import type { Deps } from "./ports/Deps";
import * as http from "http";

// Mock hash service for now - should be replaced with real implementation
const mockHashService = {
  makeSalt: async () => "mock-salt",
  hash: async (password: string) => `hashed-${password}`,
};

// Real in-memory user repository
const userRepository = new InMemoryUserRepository();

const registerAccount = new RegisterAccount({
  repository: userRepository,
  hashService: mockHashService,
});

const deps: Deps = {
  registerAccount: registerAccount.execute.bind(registerAccount),
};
const { app } = makeExpressApp(deps);

const server = http.createServer(app);
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
