import { User } from "./User";

export type HouseholdMemberRole = "admin" | "member";

export interface HouseholdMember {
  user: User;
  role: HouseholdMemberRole;
}

export class Household {
  constructor(public data: { name: string; members: HouseholdMember[] }) {}
}
