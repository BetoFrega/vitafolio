export class NewPassword {
  private constructor(private readonly value: string) {}

  static create(plainText: string): NewPassword {
    if (plainText.length < 8) {
      throw new Error("Password must be at least 8 characters long");
    }
    return new NewPassword(plainText);
  }

  getValue(): string {
    return this.value;
  }
}
