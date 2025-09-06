import { Email } from "../value-objects/Email";

export class User {
  private constructor(public data: { fullName: string; email: Email }) {}

  static create(data: { fullName: string; email: string }): User {
    return new User({
      fullName: data.fullName,
      email: Email.create(data.email),
    });
  }
}
