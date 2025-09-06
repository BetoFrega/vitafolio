import { Household, HouseholdMember } from "../aggregates/Household";
import { HouseholdRepository } from "../adapters/HouseholdRepository";

export class CreateHouseholdUseCase {
  constructor(private householdRepository: HouseholdRepository) {}

  async execute(data: {
    name: string;
    members: HouseholdMember[];
  }): Promise<Household> {
    const household = new Household(data);
    await this.householdRepository.save(household);
    return household;
  }
}
