import { Household } from "../aggregates/Household";

export interface HouseholdRepository {
  save(household: Household): Promise<void>;
}
