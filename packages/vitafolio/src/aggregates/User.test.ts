import { User } from "./User";
import { Email } from "../value-objects/Email";

describe(User, () => {
  it("should create a user instance", () => {
    const user = User.create({
      fullName: "John Doe",
      email: "john.doe@example.com",
    });
    expect(user.data.fullName).toBe("John Doe");
    expect(user.data.email).toBeInstanceOf(Email);
    expect(user.data.email.getValue()).toBe("john.doe@example.com");
  });
});
