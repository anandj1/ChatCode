import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import PageTransition from '@/components/transitions/PageTransition';

const OAuthCallback = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasProcessed, setHasProcessed] = useState(false);

  const handleOAuthSuccess = (data: any) => {
    const user = {
      _id: data.user.id || data.user._id || '',
      id: data.user.id || data.user._id || '',
      username: data.user.username,
      email: data.user.email,
      avatar: data.user.avatar,
      firstName: data.user.firstName,
      displayName: data.user.displayName
    };
    
    login(data.token, user);
  };

  useEffect(() => {
    // Prevent duplicate processing
    if (hasProcessed) {
      return;
    }
    
    const processAuth = async () => {
      const searchParams = new URLSearchParams(location.search);
      const token = searchParams.get('token');
      const error = searchParams.get('error');
      const isNewUser = searchParams.get('isNewUser') === 'true';
      
      if (error) {
        setError(error);
        setIsProcessing(false);
        
        toast({
          title: "Authentication failed",
          description: error,
          variant: "destructive",
        });
        
        // Redirect to login after showing error
        setTimeout(() => {
          navigate('/login');
        }, 3000);
        
        return;
      }
      
      if (token) {
        setHasProcessed(true);
        
        // Process the token by decoding it to get user info
        try {
          // This assumes your token has user info. In a real app, you might need to fetch user data
          const payload = JSON.parse(atob(token.split('.')[1]));
          
          // Store token
          localStorage.setItem('authToken', token);
          
          // Update auth context
          handleOAuthSuccess({
            token,
            user: {
              id: payload.id || payload.sub,
              username: payload.username,
              email: payload.email,
              avatar: payload.avatar,
              firstName: payload.firstName,
              displayName: payload.displayName || payload.name
            }
          });
          
          // Explicitly show welcome toast with proper message and variant
          const displayName = payload.firstName || payload.displayName || payload.name || payload.username;
          
          console.log("Showing welcome toast for:", displayName, "New user:", isNewUser);
          
          // Force the toast to be shown
          setTimeout(() => {
            toast({
              title: isNewUser ? "Welcome!" : "Welcome back!",
              description: isNewUser 
                ? `Hello, ${displayName}! Your account has been created.` 
                : `Hello, ${displayName}! You've successfully logged in.`,
              variant: "success",
            });
          }, 100);
          
          // Redirect to rooms page
          setTimeout(() => {
            navigate('/rooms');
          }, 500);
        } catch (err) {
          console.error("Failed to process token:", err);
          setError("Failed to process authentication data. Please try again.");
          setIsProcessing(false);
          
          toast({
            title: "Authentication failed",
            description: "Failed to process authentication data. Please try again.",
            variant: "destructive",
          });
          
          // Redirect to login after showing error
          setTimeout(() => {
            navigate('/login');
          }, 3000);
        }
      } else {
        setError("No authentication data found. Please try again.");
        setIsProcessing(false);
        
        toast({
          title: "Authentication failed",
          description: "No authentication data found. Please try again.",
          variant: "destructive",
        });
        
        // Redirect to login after showing error
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    };
    
    processAuth();
  }, [login, navigate, location.search, toast, hasProcessed]);

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md p-8 rounded-lg shadow-lg bg-secondary/10 border border-border/30 backdrop-blur-sm">
          <h1 className="text-2xl font-bold text-center mb-4">
            {error ? "Authentication Failed" : "Processing Authentication"}
          </h1>
          
          {isProcessing && !error && (
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              <p className="text-center text-muted-foreground">
                Please wait while we complete your authentication...
              </p>
            </div>
          )}
          
          {error && (
            <div className="text-center space-y-4">
              <p className="text-destructive">{error}</p>
              <p className="text-muted-foreground">
                Redirecting you back to the login page...
              </p>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
};

export default OAuthCallback;
