import { Credential, CredentialKind } from "./Credential";

describe(Credential, () => {
  it("should create a password credential", () => {
    const cred = Credential.createPassword("hashedPassword123");
    expect(cred.kind).toBe("password");
    expect(cred.getPasswordHash()).toBe("hashedPassword123");
  });
});
