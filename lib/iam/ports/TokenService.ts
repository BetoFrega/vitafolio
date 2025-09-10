export interface TokenService {
  generateAccessToken(payload: { userId: string }): Promise<string>;
  generateRefreshToken(payload: { userId: string }): Promise<string>;
  verify(
    token: string,
  ): Promise<
    | { success: true; data: { userId: string } }
    | { success: false; error: string }
  >;
}
