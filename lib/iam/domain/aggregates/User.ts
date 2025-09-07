export class User {
  private constructor(
    public readonly data: {
      id: string;
      email: string;
      hashedPassword: string;
      createdAt: Date;
    },
  ) {
    Object.freeze(this.data);
  }

  static create(data: {
    id: string;
    email: string;
    hashedPassword: string;
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
    createdAt: Date;
  }): User {
    return new User(data);
  }
}
