// Collections imports

import { makeExpressApp } from "./http/express/makeExpressApp";
import type { Deps } from "./ports/Deps";
import * as http from "http";
import { makeDeps } from "./makeDeps";

// IAM setup
const deps: Deps = makeDeps();
const { app } = makeExpressApp(deps);

const server = http.createServer(app);
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log("TokenService implementation available for Login use case");
});
