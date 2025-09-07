import { NodeHashService } from "./NodeHashService";

describe("NodeHashService", () => {
  let hashService: NodeHashService;

  beforeEach(() => {
    hashService = new NodeHashService();
  });

  describe("hash", () => {
    it("should hash a password with bcrypt", async () => {
      const password = "testPassword123";

      const hashedPassword = await hashService.hash(password);

      expect(hashedPassword).toBeDefined();
      expect(typeof hashedPassword).toBe("string");
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(0);
    });

    it("should produce different hashes for the same password on different calls", async () => {
      const password = "testPassword123";

      const hash1 = await hashService.hash(password);
      const hash2 = await hashService.hash(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe("verify", () => {
    it("should verify a correct password against its hash", async () => {
      const password = "testPassword123";
      const hashedPassword = await hashService.hash(password);

      const isValid = await hashService.verify(password, hashedPassword);

      expect(isValid).toBe(true);
    });

    it("should reject an incorrect password", async () => {
      const password = "testPassword123";
      const wrongPassword = "wrongPassword456";
      const hashedPassword = await hashService.hash(password);

      const isValid = await hashService.verify(wrongPassword, hashedPassword);

      expect(isValid).toBe(false);
    });

    it("should work with different hashes of the same password", async () => {
      const password = "testPassword123";
      const hash1 = await hashService.hash(password);
      const hash2 = await hashService.hash(password);

      // Both hashes should verify the same password even though they're different
      expect(await hashService.verify(password, hash1)).toBe(true);
      expect(await hashService.verify(password, hash2)).toBe(true);
      expect(hash1).not.toBe(hash2); // Confirm hashes are different
    });

    it("should handle empty or invalid hashes gracefully", async () => {
      const password = "testPassword123";

      const isValidEmpty = await hashService.verify(password, "");
      const isValidInvalid = await hashService.verify(password, "invalid-hash");

      expect(isValidEmpty).toBe(false);
      expect(isValidInvalid).toBe(false);
    });
  });

  describe("makeSalt", () => {
    it("should generate a random salt", async () => {
      const salt = await hashService.makeSalt();

      expect(salt).toBeDefined();
      expect(typeof salt).toBe("string");
      expect(salt.length).toBeGreaterThan(0);
    });

    it("should generate different salts on each call", async () => {
      const salt1 = await hashService.makeSalt();
      const salt2 = await hashService.makeSalt();

      expect(salt1).not.toBe(salt2);
    });

    it("should generate salt with proper length", async () => {
      const salt = await hashService.makeSalt();

      // Standard salt length for bcrypt-style operations
      expect(salt.length).toBe(32); // 16 bytes as hex string
    });
  });

  describe("randomUUID", () => {
    it("should generate a valid UUID v4", async () => {
      const uuid = await hashService.randomUUID();

      expect(uuid).toBeDefined();
      expect(typeof uuid).toBe("string");

      // UUID v4 pattern: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(uuid).toMatch(uuidRegex);
    });

    it("should generate different UUIDs on each call", async () => {
      const uuid1 = await hashService.randomUUID();
      const uuid2 = await hashService.randomUUID();

      expect(uuid1).not.toBe(uuid2);
    });
  });

  describe("integration with password + salt pattern", () => {
    it("should work with the RegisterAccount pattern (password + salt)", async () => {
      const password = "userPassword123";
      const salt = await hashService.makeSalt();

      const hashedPasswordWithSalt = await hashService.hash(password + salt);

      expect(hashedPasswordWithSalt).toBeDefined();
      expect(typeof hashedPasswordWithSalt).toBe("string");
      expect(hashedPasswordWithSalt).not.toBe(password);
      expect(hashedPasswordWithSalt).not.toBe(salt);
    });
  });
});
