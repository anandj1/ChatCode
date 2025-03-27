
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { buildApiUrl } from '@/api/config';

export const useOAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleOAuthLogin = (provider: 'github' | 'google') => {
    setIsLoading(true);
    
    try {
      // Redirect to the OAuth provider
      const providerUrl = buildApiUrl(`auth/${provider.toLowerCase()}`);
      console.log(`Redirecting to ${provider} OAuth:`, providerUrl);
      window.location.href = providerUrl;
    } catch (error) {
      console.error(`${provider} OAuth error:`, error);
      toast({
        title: "Authentication Error",
        description: `Could not connect to ${provider} authentication service.`,
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const githubLogin = () => handleOAuthLogin('github');
  const googleLogin = () => handleOAuthLogin('google');

  return {
    isLoading,
    githubLogin,
    googleLogin
  };
};
