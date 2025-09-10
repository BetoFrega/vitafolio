import type { TokenService } from "@iam/ports/TokenService";
import { vi } from "vitest";

export const createMockTokenService = (): TokenService => ({
  generateAccessToken: vi.fn(),
  generateRefreshToken: vi.fn(),
  verify: vi
    .fn()
    .mockImplementation(() => ({ success: true, data: { userId: "user-1" } })),
});
