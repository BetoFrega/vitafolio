import { RegisterAccount } from "lib/iam/app/RegisterAccount";
import { makeExpressApp } from "./http/express/makeExpressApp";
import type { Deps } from "./ports/Deps";
import * as http from "http";

const registerAccount = new RegisterAccount();

const deps: Deps = {
  registerAccount: registerAccount.execute.bind(registerAccount),
};
const { app } = makeExpressApp(deps);

const server = http.createServer(app);
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
