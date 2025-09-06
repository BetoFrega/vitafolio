export class Email {
  private constructor(private readonly value: string) {}

  static create(value: string): Email {
    const normalizedValue = value.toLowerCase().trim();
    if (!Email.isValid(normalizedValue)) {
      throw new Error("Invalid email format");
    }
    return new Email(normalizedValue);
  }

  static isValid(value: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }
}
