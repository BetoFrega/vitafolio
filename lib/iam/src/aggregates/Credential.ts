export type CredentialKind = "password";

export type CredentialData = { kind: "password"; passwordHash: string };

export class Credential {
  private constructor(
    public readonly kind: CredentialKind,
    private readonly data: CredentialData,
  ) {}

  static create(
    kind: CredentialKind,
    data: Omit<CredentialData, "kind">,
  ): Credential {
    return new Credential(kind, { ...data, kind } as CredentialData);
  }

  static createPassword(passwordHash: string): Credential {
    return new Credential("password", { kind: "password", passwordHash });
  }

  getPasswordHash(): string | undefined {
    return this.kind === "password"
      ? (this.data as any).passwordHash
      : undefined;
  }

  equals(other: Credential): boolean {
    return (
      this.kind === other.kind &&
      JSON.stringify(this.data) === JSON.stringify(other.data)
    );
  }
}
