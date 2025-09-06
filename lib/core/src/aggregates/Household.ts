import { User } from "./User";

export type HouseholdMemberRole = "admin" | "member";

export interface HouseholdMember {
  user: User;
  role: HouseholdMemberRole;
}

export class Household {
  private constructor(
    public data: { name: string; members: HouseholdMember[] },
  ) {}

  static create(data: { name: string; members: HouseholdMember[] }): Household {
    return new Household(data);
  }
}
