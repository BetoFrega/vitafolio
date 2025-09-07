import { NodeHashService } from "./NodeHashService";

/**
 * Demo showing how bcrypt password verification works
 */
async function demonstrateBcryptVerification() {
  const hashService = new NodeHashService();
  const password = "mySecretPassword123";

  console.log("=== Bcrypt Password Verification Demo ===\n");

  // Hash the same password multiple times
  console.log("1. Hashing the same password multiple times:");
  const hash1 = await hashService.hash(password);
  const hash2 = await hashService.hash(password);
  const hash3 = await hashService.hash(password);

  console.log(`Password: "${password}"`);
  console.log(`Hash 1:   ${hash1}`);
  console.log(`Hash 2:   ${hash2}`);
  console.log(`Hash 3:   ${hash3}`);
  console.log(
    `All hashes are different: ${hash1 !== hash2 && hash2 !== hash3}\n`,
  );

  // Verify the password against all hashes
  console.log("2. Verifying the password against all hashes:");
  const verify1 = await hashService.verify(password, hash1);
  const verify2 = await hashService.verify(password, hash2);
  const verify3 = await hashService.verify(password, hash3);

  console.log(`Password verifies against Hash 1: ${verify1}`);
  console.log(`Password verifies against Hash 2: ${verify2}`);
  console.log(`Password verifies against Hash 3: ${verify3}\n`);

  // Try with wrong password
  console.log("3. Verifying wrong password:");
  const wrongPassword = "wrongPassword456";
  const wrongVerify = await hashService.verify(wrongPassword, hash1);
  console.log(`Wrong password "${wrongPassword}" verifies: ${wrongVerify}\n`);

  // Show how bcrypt hash structure works
  console.log("4. Understanding bcrypt hash structure:");
  console.log(`Hash example: ${hash1}`);
  console.log("Structure: $2b$rounds$saltrandomchars.hashedpasswordchars");
  console.log("- $2b = bcrypt algorithm identifier");
  console.log("- $12 = cost factor (salt rounds)");
  console.log("- Next 22 chars = salt (base64 encoded)");
  console.log("- Remaining chars = actual hash");
  console.log("\nThe salt is embedded in the hash, so bcrypt.compare() can:");
  console.log("1. Extract the salt from the stored hash");
  console.log("2. Use that salt to hash the input password");
  console.log("3. Compare the result with the stored hash");
}

// Only run if this file is executed directly
if (require.main === module) {
  demonstrateBcryptVerification().catch(console.error);
}

export { demonstrateBcryptVerification };
