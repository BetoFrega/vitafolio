export type CredentialKind = "password" | "oauth" | "passkey" | "magic_link";

export type CredentialData =
  | { kind: "password"; passwordHash: string }
  | { kind: "oauth"; provider: string; oauthId: string }
  | { kind: "passkey"; publicKey: string; challenge: string }
  | { kind: "magic_link"; token: string };

export class Credential {
  private constructor(
    public readonly kind: CredentialKind,
    private readonly data: CredentialData,
  ) {}

  static create(
    kind: CredentialKind,
    data: Omit<CredentialData, "kind">,
  ): Credential {
    if (!Credential.isValidKind(kind)) {
      throw new Error("Invalid credential kind");
    }
    return new Credential(kind, { ...data, kind } as CredentialData);
  }

  static createPassword(passwordHash: string): Credential {
    return new Credential("password", { kind: "password", passwordHash });
  }

  static createOAuth(provider: string, oauthId: string): Credential {
    return new Credential("oauth", { kind: "oauth", provider, oauthId });
  }

  static createPasskey(publicKey: string, challenge: string): Credential {
    return new Credential("passkey", { kind: "passkey", publicKey, challenge });
  }

  static createMagicLink(token: string): Credential {
    return new Credential("magic_link", { kind: "magic_link", token });
  }

  static isValidKind(kind: string): kind is CredentialKind {
    return ["password", "oauth", "passkey", "magic_link"].includes(kind);
  }

  // Type-safe getters
  getPasswordHash(): string | undefined {
    return this.kind === "password"
      ? (this.data as any).passwordHash
      : undefined;
  }

  getOAuthProvider(): string | undefined {
    return this.kind === "oauth" ? (this.data as any).provider : undefined;
  }

  getOAuthId(): string | undefined {
    return this.kind === "oauth" ? (this.data as any).oauthId : undefined;
  }

  getPublicKey(): string | undefined {
    return this.kind === "passkey" ? (this.data as any).publicKey : undefined;
  }

  getToken(): string | undefined {
    return this.kind === "magic_link" ? (this.data as any).token : undefined;
  }

  equals(other: Credential): boolean {
    return (
      this.kind === other.kind &&
      JSON.stringify(this.data) === JSON.stringify(other.data)
    );
  }
}
