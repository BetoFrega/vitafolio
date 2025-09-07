import { RegisterAccount } from "lib/iam/app/RegisterAccount";
import { startExpressServer } from "./http/express/startExpressServer";
import type { Deps } from "./ports/Deps";

const registerAccount = new RegisterAccount();

const deps: Deps = {
  registerAccount: registerAccount.execute.bind(registerAccount),
};

startExpressServer(deps);
