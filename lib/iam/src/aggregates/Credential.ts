export enum CredentialKind {
  Password = "password",
}

export type CredentialData = {
  kind: CredentialKind.Password;
  passwordHash: string;
};

export class Credential {
  private constructor(
    public readonly kind: CredentialKind,
    private readonly data: CredentialData,
  ) {}

  static createPassword(passwordHash: string): Credential {
    return new Credential(CredentialKind.Password, {
      kind: CredentialKind.Password,
      passwordHash,
    });
  }

  getPasswordHash(): string | undefined {
    return this.kind === CredentialKind.Password
      ? this.data.passwordHash
      : undefined;
  }

  equals(other: Credential): boolean {
    return (
      this.kind === other.kind &&
      JSON.stringify(this.data) === JSON.stringify(other.data)
    );
  }
}
