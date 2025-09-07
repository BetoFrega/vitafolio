export class Email {
  private constructor(private readonly value: string) {}

  static create(value: string): Email {
    const normalized = value.toLowerCase().trim();
    if (!Email.isValid(normalized)) {
      throw new Error(`Invalid email format: ${value}`);
    }
    return new Email(normalized);
  }

  static isValid(value: string): boolean {
    // Simple and safe email regex - allows common characters, rejects control characters and complex edge cases
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(value);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }
}
