import { RegisterAccount } from "lib/iam/app/RegisterAccount";
import { InMemoryUserRepository } from "lib/iam/adapters/InMemoryUserRepository";
import { NodeHashService } from "lib/iam/adapters/NodeHashService";
import { makeExpressApp } from "./http/express/makeExpressApp";
import type { Deps } from "./ports/Deps";
import * as http from "http";

const hashService = new NodeHashService();
const userRepository = new InMemoryUserRepository();

const registerAccount = new RegisterAccount({
  repository: userRepository,
  hashService: hashService,
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
