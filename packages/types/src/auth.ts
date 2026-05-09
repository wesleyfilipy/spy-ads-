export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: import('./user').User;
  tokens: AuthTokens;
}

export interface JWTPayload {
  sub: string;
  email: string;
  role: import('./user').UserRole;
  iat: number;
  exp: number;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}
