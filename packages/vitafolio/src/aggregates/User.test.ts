import { User } from "./User";

describe(User, () => {
  it("should create a user instance", () => {
    const user = new User({
      fullName: "John Doe",
      email: "john.doe@example.com",
    });
    expect(user.data.fullName).toBe("John Doe");
    expect(user.data.email).toBe("john.doe@example.com");
  });
});
