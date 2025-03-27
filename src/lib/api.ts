import { buildApiUrl } from '@/api/config';

interface ContactFormData {
  name: string;
  email: string;
  message: string;
}

interface EmailData {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

interface ApiResponse {
  success: boolean;
  error?: string;
}

export const sendContactForm = async (data: ContactFormData): Promise<ApiResponse> => {
  try {
    const response = await fetch(buildApiUrl('email/send'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to send message');
    }

    return result;
  } catch (error) {
    console.error("Error sending contact form:", error);
    throw error;
  }
};

export const sendEmail = async (data: EmailData, token?: string): Promise<ApiResponse> => {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(buildApiUrl('email/send'), {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to send email');
    }

    return result;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

interface UserResponse {
  user: {
    id: string;
    username: string;
    email: string;
    avatar?: string;
  };
}

export const getUserByEmail = async (email: string, token: string): Promise<UserResponse | null> => {
  try {
    const url = buildApiUrl(`users/by-email?email=${encodeURIComponent(email)}`);
    console.log("Looking up user at URL:", url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log("User lookup response status:", response.status);
    
    if (response.status === 404) {
      console.log("User not found with email:", email);
      return null;
    }
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to fetch user: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("User found:", data);
    return data;
  } catch (error) {
    console.error("Error looking up user by email:", error);
    throw error;
  }
}