export class User {
  private constructor(
    public readonly data: {
      id: string;
      email: string;
      hashedPassword: string;
      salt: string;
      createdAt: Date;
    },
  ) {
    // Make data readonly by freezing it
    Object.freeze(this.data);
  }

  static create(data: {
    id: string;
    email: string;
    hashedPassword: string;
    salt: string;
  }): User {
    return new User({
      ...data,
      createdAt: new Date(),
    });
  }

  static fromData(data: {
    id: string;
    email: string;
    hashedPassword: string;
    salt: string;
    createdAt: Date;
  }): User {
    return new User(data);
  }
}
