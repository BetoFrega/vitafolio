export class User {
  private constructor(public data: { fullName: string; email: string }) {}

  static create(data: { fullName: string; email: string }): User {
    return new User(data);
  }
}
