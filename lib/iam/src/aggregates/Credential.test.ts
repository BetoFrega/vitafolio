import { Credential, CredentialKind } from "./Credential";

describe(Credential, () => {
  it("should create a password credential", () => {
    const cred = Credential.createPassword("hashedPassword123");
    expect(cred.kind).toBe("password");
    expect(cred.getPasswordHash()).toBe("hashedPassword123");
  });

  it("should create an OAuth credential", () => {
    const cred = Credential.createOAuth("google", "oauthId123");
    expect(cred.kind).toBe("oauth");
    expect(cred.getOAuthProvider()).toBe("google");
    expect(cred.getOAuthId()).toBe("oauthId123");
  });

  it("should create a passkey credential", () => {
    const cred = Credential.createPasskey("publicKey123", "challenge123");
    expect(cred.kind).toBe("passkey");
    expect(cred.getPublicKey()).toBe("publicKey123");
  });

  it("should create a magic link credential", () => {
    const cred = Credential.createMagicLink("token123");
    expect(cred.kind).toBe("magic_link");
    expect(cred.getToken()).toBe("token123");
  });

  it("should validate credential kinds", () => {
    expect(Credential.isValidKind("password")).toBe(true);
    expect(Credential.isValidKind("invalid")).toBe(false);
  });

  it("should throw error for invalid kind", () => {
    expect(() => Credential.create("invalid" as CredentialKind, {})).toThrow(
      "Invalid credential kind",
    );
  });
});
