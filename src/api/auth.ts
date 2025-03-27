import { API_BASE_URL, buildApiUrl } from "./config";

/**
 * Authentication API functions
 */

interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}

interface VerifyOtpPayload {
  email: string;
  otp: string;
}

interface LoginPayload {
  email: string;
  password: string;
}

interface AuthResponse {
  token?: string;
  user?: {
    id: string;
    username: string;
    email: string;
    avatar?: string;
  };
  message?: string;
  email?: string;
}

// Register a new user
export const register = async (data: RegisterPayload): Promise<AuthResponse> => {
  console.log(`Sending registration request to ${buildApiUrl("auth/register")}`, data);
  
  const response = await fetch(buildApiUrl("auth/register"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error("Registration failed:", response.status, errorData);
    throw new Error(errorData.message || "Registration failed");
  }

  return response.json();
};

// Verify OTP
export const verifyOtp = async (data: VerifyOtpPayload): Promise<AuthResponse> => {
  console.log(`Sending OTP verification request to ${buildApiUrl("auth/verify-otp")}`, data);
  
  const response = await fetch(buildApiUrl("auth/verify-otp"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error("OTP verification failed:", response.status, errorData);
    throw new Error(errorData.message || "OTP verification failed");
  }

  return response.json();
};

// Resend OTP
export const resendOtp = async (email: string): Promise<AuthResponse> => {
  console.log(`Sending OTP resend request to ${buildApiUrl("auth/resend-otp")}`, { email });
  
  const response = await fetch(buildApiUrl("auth/resend-otp"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error("Resend OTP failed:", response.status, errorData);
    throw new Error(errorData.message || "Failed to resend OTP");
  }

  return response.json();
};

// Login user
export const login = async (data: LoginPayload): Promise<AuthResponse> => {
  console.log(`Sending login request to ${buildApiUrl("auth/login")}`, data);
  
  const response = await fetch(buildApiUrl("auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error("Login failed:", response.status, errorData);
    throw new Error(errorData.message || "Login failed");
  }

  return response.json();
};

// Get current user details
export const getCurrentUser = async (token: string): Promise<AuthResponse> => {
  console.log(`Fetching current user from ${buildApiUrl("auth/me")}`);
  
  const response = await fetch(buildApiUrl("auth/me"), {
    method: "GET",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error("Get current user failed:", response.status, errorData);
    throw new Error(errorData.message || "Failed to fetch user data");
  }

  return response.json();
};

export const getGithubAuthUrl = (): string => buildApiUrl('auth/github');
export const getGoogleAuthUrl = (): string => buildApiUrl('auth/google');
