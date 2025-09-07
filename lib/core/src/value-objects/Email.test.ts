import { Email } from "./Email";

describe(Email, () => {
  describe("create", () => {
    it("should create a valid email", () => {
      const email = Email.create("john.doe@example.com");
      expect(email.getValue()).toBe("john.doe@example.com");
    });

    it("should trim whitespace and convert to lowercase", () => {
      const email = Email.create("  JOHN.DOE@EXAMPLE.COM  ");
      expect(email.getValue()).toBe("john.doe@example.com");
    });

    it("should throw error for invalid email format", () => {
      expect(() => Email.create("invalid-email")).toThrow(
        "Invalid email format",
      );
      expect(() => Email.create("")).toThrow("Invalid email format");
      expect(() => Email.create("@example.com")).toThrow(
        "Invalid email format",
      );
      expect(() => Email.create("user@")).toThrow("Invalid email format");
    });
  });

  describe("isValid", () => {
    it("should return true for valid emails", () => {
      expect(Email.isValid("user@example.com")).toBe(true);
      expect(Email.isValid("test.email+tag@domain.co.uk")).toBe(true);
    });

    it("should return false for invalid emails", () => {
      expect(Email.isValid("invalid")).toBe(false);
      expect(Email.isValid("user@")).toBe(false);
      expect(Email.isValid("@domain.com")).toBe(false);
    });
  });

  describe("getValue", () => {
    it("should return the email value", () => {
      const email = Email.create("test@example.com");
      expect(email.getValue()).toBe("test@example.com");
    });
  });

  describe("equals", () => {
    it("should return true for equal emails", () => {
      const email1 = Email.create("test@example.com");
      const email2 = Email.create("test@example.com");
      expect(email1.equals(email2)).toBe(true);
    });

    it("should return false for different emails", () => {
      const email1 = Email.create("test@example.com");
      const email2 = Email.create("other@example.com");
      expect(email1.equals(email2)).toBe(false);
    });
  });

  describe("getDomain", () => {
    it("should return the domain part", () => {
      const email = Email.create("user@domain.com");
      expect(email.getDomain()).toBe("domain.com");
    });
  });

  describe("getLocalPart", () => {
    it("should return the local part", () => {
      const email = Email.create("user@domain.com");
      expect(email.getLocalPart()).toBe("user");
    });
  });
});
