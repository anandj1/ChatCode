import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getCurrentUser } from '@/api/auth';

const API_BASE_URL =  'https://chat-code-3fz6.onrender.com/api';

interface User {
  _id: string;
  id: string;
  username: string;
  email: string;
  avatar?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  githubId?: string;
  googleId?: string;
  isVerified?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  register: (email: string, password: string, username: string) => Promise<{ email: string; message: string } | { error: string }>;
  verifyOtp: (email: string, otp: string) => Promise<{ user: User; token: string } | { message: string }>;
  resendOtp: (email: string) => Promise<{ message: string }>;
  oauthGithub: () => Promise<void>;
  oauthGoogle: () => void;
  updateUserProfile: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  useEffect(() => {
    const loadAuthState = async () => {
      try {
        console.log("Loading authentication state from localStorage");
        const storedToken = localStorage.getItem('authToken');
        const storedUser = localStorage.getItem('user');
        
        if (storedToken && storedUser) {
          console.log("Found stored authentication data");
          try {
            setToken(storedToken);
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            console.log("Auth state restored from localStorage:", { username: parsedUser.username });
            
            try {
              const userData = await getCurrentUser(storedToken);
              if (userData) {
                console.log("Token verified with backend");
              }
            } catch (error) {
              console.warn("Could not verify token with backend, using stored user data");
            }
          } catch (error) {
            console.error("Error parsing stored user data:", error);
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            console.log("Cleared invalid auth data from localStorage");
          }
        } else {
          console.log("No stored authentication data found");
        }
      } catch (error) {
        console.error("Error loading auth state:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadAuthState();
  }, []);
  
  const login = (newToken: string, newUser: User) => {
    console.log("Logging in user:", newUser.username);
  
    const normalizedUser = { 
      ...newUser, 
      id: newUser.id || newUser._id || '', 
      _id: newUser._id || newUser.id || '' 
    };
  
    try {
      localStorage.setItem('authToken', newToken);
      localStorage.setItem('user', JSON.stringify(normalizedUser));
      
      setToken(newToken);
      setUser(normalizedUser);
      
      if (!loading) {
        const displayName =
          normalizedUser.firstName ||
          normalizedUser.displayName?.split(' ')[0] ||
          normalizedUser.username;
        
        toast({
          title: `Welcome back ${displayName}!`,
          description: "You've successfully logged in.",
          variant: "success",
        });
      }
      
      console.log("User logged in successfully:", normalizedUser);
    } catch (error) {
      console.error("Error during login:", error);
      toast({
        title: "Login error",
        description: "There was a problem during login. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const register = async (email: string, password: string, username: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, username }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          if (data.field === 'email') {
            return { error: 'An account with this email already exists. Please log in instead.' };
          } else if (data.field === 'username') {
            return { error: 'This username is already taken. Please choose another one.' };
          }
        }
        return { error: data.message || 'Registration failed' };
      }

      return { email: data.email, message: data.message };
    } catch (error) {
      console.error('Registration error:', error);
      return { error: 'An error occurred during registration. Please try again.' };
    }
  };

  const verifyOtp = async (email: string, otp: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { message: data.message || 'OTP verification failed' };
      }

      if (data.token && data.user) {
        login(data.token, data.user);
        return { user: data.user, token: data.token };
      }

      return { message: 'Verification failed' };
    } catch (error) {
      console.error('OTP verification error:', error);
      return { message: 'An error occurred during verification. Please try again.' };
    }
  };

  const resendOtp = async (email: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/resend-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { message: data.message || 'Failed to resend OTP' };
      }

      return { message: data.message };
    } catch (error) {
      console.error('Resend OTP error:', error);
      return { message: 'An error occurred while resending OTP. Please try again.' };
    }
  };

  const oauthGithub = async () => {
    try {
      window.location.href = `${API_BASE_URL}/auth/github`;
      console.log("Redirecting to GitHub OAuth");
    } catch (error) {
      console.error('GitHub OAuth error:', error);
      toast({
        title: "Authentication Error",
        description: "Could not connect to GitHub authentication service.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const oauthGoogle = () => {
    window.location.href = `${API_BASE_URL}/auth/google`;
    console.log("Redirecting to Google OAuth");
  };
  
  const logout = () => {
    console.log("Logging out user");
    
    try {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      
      setToken(null);
      setUser(null);
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
        variant: "success",
      });
      
      console.log("User logged out successfully");
    } catch (error) {
      console.error("Error during logout:", error);
      toast({
        title: "Logout error",
        description: "There was a problem during logout.",
        variant: "destructive",
      });
    }
  };
  
  const updateUserProfile = (userData: Partial<User>) => {
    if (user) {
      try {
        console.log("Updating user profile:", userData);
        const updatedUser = { ...user, ...userData };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        
        toast({
          title: "Profile updated",
          description: "Your profile has been successfully updated.",
          variant: "success",
        });
        
        console.log("User profile updated successfully");
      } catch (error) {
        console.error("Error updating user profile:", error);
        toast({
          title: "Update error",
          description: "There was a problem updating your profile.",
          variant: "destructive",
        });
      }
    } else {
      console.error("Cannot update profile: No user is logged in");
      toast({
        title: "Update error",
        description: "You must be logged in to update your profile.",
        variant: "destructive",
      });
    }
  };
  
  useEffect(() => {
    console.log("Auth state updated - isAuthenticated:", !!token, user ? `User: ${user.username}` : "No user");
  }, [token, user]);
  
  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        token, 
        isAuthenticated: !!token, 
        loading,
        login, 
        logout,
        register,
        verifyOtp,
        resendOtp,
        oauthGithub,
        oauthGoogle,
        updateUserProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
