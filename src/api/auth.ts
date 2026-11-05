// greenwallet-frontend/src/api/auth.ts

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000";

export interface PublicUser {
  id: string;
  email: string;
  phone: string | null;
  name: string;
  platformRole: string;
  emailVerifiedAt: string | null;
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  type: "BUSINESS" | "INDIVIDUAL";
  roles: Array<"BUYER" | "SUPPLIER" | "EXPORTER">;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  phone?: string;
  organizationName: string;
  organizationType: "BUSINESS" | "INDIVIDUAL";
  roles: Array<"BUYER" | "SUPPLIER" | "EXPORTER">;
}

export interface RegisterResponse {
  user: PublicUser;
  organization: Organization;
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: string;
  verificationToken?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: string;
}

export interface RefreshResponse {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: string;
}

export interface VerifyEmailResponse {
  user: PublicUser;
}

export interface ResendVerificationResponse {
  message: string;
  verificationToken?: string;
}

const STORAGE_KEYS = {
  ACCESS_TOKEN: "gw_access_token",
  REFRESH_TOKEN: "gw_refresh_token",
  USER: "gw_user",
  PENDING_EMAIL: "gw_pending_email",
};

export const authStorage = {
  saveSession(session: { accessToken: string; refreshToken: string; user: PublicUser }) {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, session.accessToken);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, session.refreshToken);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(session.user));
    if (session.user.email) {
      localStorage.setItem(STORAGE_KEYS.PENDING_EMAIL, session.user.email);
    }
  },
  getAccessToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  },
  setAccessToken(token: string) {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
  },
  getRefreshToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  },
  setRefreshToken(token: string) {
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
  },
  getUser(): PublicUser | null {
    const raw = localStorage.getItem(STORAGE_KEYS.USER);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as PublicUser;
    } catch {
      return null;
    }
  },
  setUser(user: PublicUser) {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  },
  getPendingEmail(): string | null {
    return localStorage.getItem(STORAGE_KEYS.PENDING_EMAIL);
  },
  setPendingEmail(email: string) {
    localStorage.setItem(STORAGE_KEYS.PENDING_EMAIL, email);
  },
  clearSession() {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
  },
};

async function handleResponse<T>(res: Response): Promise<T> {
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json() : null;

  if (!res.ok) {
    const errorMsg =
      data?.detail ||
      data?.message ||
      (data?.errors && typeof data.errors === "object"
        ? Object.values(data.errors).flat().join(", ")
        : null) ||
      `Request failed with status ${res.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

export async function registerApi(data: RegisterRequest): Promise<RegisterResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<RegisterResponse>(res);
}

export async function loginApi(data: LoginRequest): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<LoginResponse>(res);
}

export async function refreshApi(refreshToken: string): Promise<RefreshResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  return handleResponse<RefreshResponse>(res);
}

export async function verifyEmailApi(token: string): Promise<VerifyEmailResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/verify-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  return handleResponse<VerifyEmailResponse>(res);
}

export async function resendVerificationApi(accessToken?: string): Promise<ResendVerificationResponse> {
  let token = accessToken || authStorage.getAccessToken();

  // If token is missing, attempt refresh if refresh token exists
  if (!token) {
    const refreshToken = authStorage.getRefreshToken();
    if (refreshToken) {
      try {
        const refreshed = await refreshApi(refreshToken);
        authStorage.saveSession({
          accessToken: refreshed.accessToken,
          refreshToken: refreshed.refreshToken,
          user: refreshed.user,
        });
        token = refreshed.accessToken;
      } catch {
        // failed refresh
      }
    }
  }

  if (!token) {
    throw new Error("You must be signed in to request a new verification link.");
  }

  let res = await fetch(`${API_BASE_URL}/api/v1/auth/resend-verification`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  // If token expired, try to refresh and retry once
  if (res.status === 401) {
    const refreshToken = authStorage.getRefreshToken();
    if (refreshToken) {
      const refreshed = await refreshApi(refreshToken);
      authStorage.saveSession({
        accessToken: refreshed.accessToken,
        refreshToken: refreshed.refreshToken,
        user: refreshed.user,
      });
      token = refreshed.accessToken;
      res = await fetch(`${API_BASE_URL}/api/v1/auth/resend-verification`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    }
  }

  return handleResponse<ResendVerificationResponse>(res);
}

export async function logoutApi(refreshToken: string): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
  } catch {
    // ignore
  } finally {
    authStorage.clearSession();
  }
}
