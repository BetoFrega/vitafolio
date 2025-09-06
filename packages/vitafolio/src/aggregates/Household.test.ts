import { User } from "./User";
import { Household } from "./Household";

describe(Household, () => {
  it("should create a household instance", () => {
    const adminUser = new User({
      fullName: "John Doe",
      email: "john.doe@example.com",
    });

    const memberUser = new User({
      fullName: "Jane Doe",
      email: "jane.doe@example.com",
    });

    const household = new Household({
      name: "Doe Family",
      members: [
        { user: adminUser, role: "admin" },
        { user: memberUser, role: "member" },
      ],
    });

    expect(household.data.name).toBe("Doe Family");
    expect(household.data.members).toHaveLength(2);
    expect(household.data.members[0].user.data.fullName).toBe("John Doe");
    expect(household.data.members[0].role).toBe("admin");
    expect(household.data.members[1].user.data.fullName).toBe("Jane Doe");
    expect(household.data.members[1].role).toBe("member");
  });
});
