export class Email {
  private constructor(private readonly value: string) {}

  static create(value: string): Email {
    const trimmedValue = value.toLowerCase().trim();
    if (!Email.isValid(trimmedValue)) {
      throw new Error("Invalid email format");
    }
    return new Email(trimmedValue);
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

  getDomain(): string {
    return this.value.split("@")[1];
  }

  getLocalPart(): string {
    return this.value.split("@")[0];
  }
}
