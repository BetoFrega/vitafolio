export interface TokenService {
  generateAccessToken(payload: { userId: string }): Promise<string>;
  generateRefreshToken(payload: { userId: string }): Promise<string>;
}
