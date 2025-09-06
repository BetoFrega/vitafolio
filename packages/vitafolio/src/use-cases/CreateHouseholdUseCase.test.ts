import { User } from "../aggregates/User";
import { HouseholdRepository } from "../adapters/HouseholdRepository";
import { CreateHouseholdUseCase } from "./CreateHouseholdUseCase";

describe(CreateHouseholdUseCase, () => {
  it("should create and save a household", async () => {
    const mockHouseholdRepository: HouseholdRepository = {
      save: vi.fn().mockResolvedValue(undefined),
    };

    const createHouseholdUseCase = new CreateHouseholdUseCase(
      mockHouseholdRepository,
    );

    const adminUser = new User({
      fullName: "John Doe",
      email: "john.doe@example.com",
    });

    const memberUser = new User({
      fullName: "Jane Doe",
      email: "jane.doe@example.com",
    });

    const householdData = {
      name: "Doe Family",
      members: [
        { user: adminUser, role: "admin" as const },
        { user: memberUser, role: "member" as const },
      ],
    };

    const household = await createHouseholdUseCase.execute(householdData);

    expect(household.data.name).toBe("Doe Family");
    expect(household.data.members).toHaveLength(2);
    expect(household.data.members[0].user.data.fullName).toBe("John Doe");
    expect(household.data.members[0].role).toBe("admin");
    expect(household.data.members[1].user.data.fullName).toBe("Jane Doe");
    expect(household.data.members[1].role).toBe("member");
    expect(mockHouseholdRepository.save).toHaveBeenCalledWith(household);
  });
});
