import { describe, it, expect, beforeEach } from "vitest";
import { NodeTokenService } from "./NodeTokenService";

describe("NodeTokenService", () => {
  let tokenService: NodeTokenService;

  beforeEach(() => {
    tokenService = new NodeTokenService();
  });

  describe("generateAccessToken", () => {
    it("should generate a valid JWT access token", async () => {
      const payload = { userId: "user123" };

      const token = await tokenService.generateAccessToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.split(".")).toHaveLength(3); // JWT has 3 parts separated by dots
    });

    it("should generate different tokens for the same payload on different calls", async () => {
      const payload = { userId: "user123" };

      const token1 = await tokenService.generateAccessToken(payload);
      const token2 = await tokenService.generateAccessToken(payload);

      expect(token1).not.toBe(token2);
    });

    it("should generate different tokens for different user IDs", async () => {
      const payload1 = { userId: "user123" };
      const payload2 = { userId: "user456" };

      const token1 = await tokenService.generateAccessToken(payload1);
      const token2 = await tokenService.generateAccessToken(payload2);

      expect(token1).not.toBe(token2);
    });

    it("should include the userId in the token payload", async () => {
      const payload = { userId: "user123" };

      const token = await tokenService.generateAccessToken(payload);

      // Decode the payload (middle part of JWT)
      const payloadPart = token.split(".")[1];
      expect(payloadPart).toBeDefined();
      const decodedPayload = JSON.parse(
        Buffer.from(payloadPart!, "base64").toString(),
      );

      expect(decodedPayload.userId).toBe("user123");
    });
  });

  describe("generateRefreshToken", () => {
    it("should generate a valid JWT refresh token", async () => {
      const payload = { userId: "user123" };

      const token = await tokenService.generateRefreshToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.split(".")).toHaveLength(3); // JWT has 3 parts separated by dots
    });

    it("should generate different tokens for the same payload on different calls", async () => {
      const payload = { userId: "user123" };

      const token1 = await tokenService.generateRefreshToken(payload);
      const token2 = await tokenService.generateRefreshToken(payload);

      expect(token1).not.toBe(token2);
    });

    it("should generate different tokens for different user IDs", async () => {
      const payload1 = { userId: "user123" };
      const payload2 = { userId: "user456" };

      const token1 = await tokenService.generateRefreshToken(payload1);
      const token2 = await tokenService.generateRefreshToken(payload2);

      expect(token1).not.toBe(token2);
    });

    it("should include the userId in the token payload", async () => {
      const payload = { userId: "user123" };

      const token = await tokenService.generateRefreshToken(payload);

      // Decode the payload (middle part of JWT)
      const payloadPart = token.split(".")[1];
      expect(payloadPart).toBeDefined();
      const decodedPayload = JSON.parse(
        Buffer.from(payloadPart!, "base64").toString(),
      );

      expect(decodedPayload.userId).toBe("user123");
    });
  });

  describe("token differences", () => {
    it("should generate different access and refresh tokens for the same user", async () => {
      const payload = { userId: "user123" };

      const accessToken = await tokenService.generateAccessToken(payload);
      const refreshToken = await tokenService.generateRefreshToken(payload);

      expect(accessToken).not.toBe(refreshToken);
    });
  });

  describe("token structure validation", () => {
    it("should generate tokens with proper JWT structure and expiration for access token", async () => {
      const payload = { userId: "user123" };

      const token = await tokenService.generateAccessToken(payload);
      const payloadPart = token.split(".")[1];
      expect(payloadPart).toBeDefined();
      const decodedPayload = JSON.parse(
        Buffer.from(payloadPart!, "base64").toString(),
      );

      expect(decodedPayload.userId).toBe("user123");
      expect(decodedPayload.iat).toBeDefined(); // issued at time
      expect(decodedPayload.exp).toBeDefined(); // expiration time
      expect(decodedPayload.exp).toBeGreaterThan(decodedPayload.iat);
    });

    it("should generate tokens with proper JWT structure and expiration for refresh token", async () => {
      const payload = { userId: "user123" };

      const token = await tokenService.generateRefreshToken(payload);
      const payloadPart = token.split(".")[1];
      expect(payloadPart).toBeDefined();
      const decodedPayload = JSON.parse(
        Buffer.from(payloadPart!, "base64").toString(),
      );

      expect(decodedPayload.userId).toBe("user123");
      expect(decodedPayload.iat).toBeDefined(); // issued at time
      expect(decodedPayload.exp).toBeDefined(); // expiration time
      expect(decodedPayload.exp).toBeGreaterThan(decodedPayload.iat);
    });

    it("should have different expiration times for access and refresh tokens", async () => {
      const payload = { userId: "user123" };

      const accessToken = await tokenService.generateAccessToken(payload);
      const refreshToken = await tokenService.generateRefreshToken(payload);

      const accessPayloadPart = accessToken.split(".")[1];
      const refreshPayloadPart = refreshToken.split(".")[1];
      expect(accessPayloadPart).toBeDefined();
      expect(refreshPayloadPart).toBeDefined();

      const accessPayload = JSON.parse(
        Buffer.from(accessPayloadPart!, "base64").toString(),
      );
      const refreshPayload = JSON.parse(
        Buffer.from(refreshPayloadPart!, "base64").toString(),
      );

      // Refresh token should have longer expiration than access token
      expect(refreshPayload.exp).toBeGreaterThan(accessPayload.exp);
    });
  });
});
