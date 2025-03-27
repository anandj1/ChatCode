import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import PageTransition from '@/components/transitions/PageTransition';
import { useAuth } from '@/context/AuthContext';
import { useOAuth } from '@/hooks/useOAuth';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { buildApiUrl } from '@/api/config';
import { motion } from 'framer-motion';
import { Github } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

type LoginFormData = z.infer<typeof loginSchema>;

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { githubLogin, googleLogin } = useOAuth();
  
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });
  
  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    
    try {
      const response = await fetch(buildApiUrl('auth/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Login failed');
      }
      
      const handleLoginSuccess = (data: any) => {
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
        
        if (!isLoading) { // Prevents duplicate toasts
          // Show welcome message with user's name
          const displayName = result.user.firstName || result.user.displayName || result.user.username;
          toast({
            title: "Welcome back!",
            description: `Hello, ${displayName}! You've successfully logged in.`,
            variant: "success",
          });
        }
        
        navigate('/rooms');
      };
      
      handleLoginSuccess(result);
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login failed",
        description: (error as Error).message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <PageTransition>
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-primary/5 to-background">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-lg shadow-xl border border-white/10 backdrop-blur-sm overflow-hidden">
            <div className="p-8">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-white/90 to-white/70 bg-clip-text text-transparent">Sign In</h1>
                <p className="text-gray-400 mt-2">Welcome back! Sign in to your account.</p>
              </div>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">Email</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="email"
                            placeholder="you@example.com"
                            className="bg-slate-800/50 border-slate-700 text-white placeholder:text-gray-500 focus-visible:ring-slate-600"
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex justify-between items-center">
                          <FormLabel className="text-gray-300">Password</FormLabel>
                          <Link to="/forgot-password" className="text-sm text-primary hover:text-primary/80 transition">
                            Forgot password?
                          </Link>
                        </div>
                        <FormControl>
                          <Input
                            {...field}
                            type="password"
                            placeholder="••••••••"
                            className="bg-slate-800/50 border-slate-700 text-white placeholder:text-gray-500 focus-visible:ring-slate-600"
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white" 
                    disabled={isLoading}
                    size="lg"
                  >
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </Form>
              
              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-700"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-slate-800/90 text-gray-400">Or continue with</span>
                  </div>
                </div>
                
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full bg-[#24292e] hover:bg-[#2F353A] text-white border-gray-700 shadow-lg hover:shadow-xl transition-all"
                      onClick={githubLogin}
                    >
                      <Github className="mr-2 h-4 w-4" />
                      GitHub
                    </Button>
                  </motion.div>
                  
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      type="button"
                      className="w-full flex items-center justify-center bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 shadow-lg hover:shadow-xl transition-all"
                      onClick={googleLogin}
                    >
                      <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                        <path
                          fill="#EA4335"
                          d="M5.26620003,9.76452941 C6.19878754,6.93863203 8.85444915,4.90909091 12,4.90909091 C13.6909091,4.90909091 15.2181818,5.50909091 16.4181818,6.49090909 L19.9090909,3 C17.7818182,1.14545455 15.0545455,0 12,0 C7.27006974,0 3.1977497,2.69829785 1.23999023,6.65002441 L5.26620003,9.76452941 Z"
                        />
                        <path
                          fill="#34A853"
                          d="M16.0407269,18.0125889 C14.9509167,18.7163016 13.5660892,19.0909091 12,19.0909091 C8.86648613,19.0909091 6.21911939,17.076871 5.27698177,14.2678769 L1.23746264,17.3349879 C3.19279051,21.2936293 7.26500293,24 12,24 C14.9328362,24 17.7353462,22.9573905 19.834192,20.9995801 L16.0407269,18.0125889 Z"
                        />
                        <path
                          fill="#4A90E2"
                          d="M19.834192,20.9995801 C22.0291676,18.9520994 23.4545455,15.903663 23.4545455,12 C23.4545455,11.2909091 23.3454545,10.5818182 23.1818182,9.90909091 L12,9.90909091 L12,14.4545455 L18.4363636,14.4545455 C18.1187732,16.013626 17.2662994,17.2212117 16.0407269,18.0125889 L19.834192,20.9995801 Z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.27698177,14.2678769 C5.03832634,13.556323 4.90909091,12.7937589 4.90909091,12 C4.90909091,11.2182781 5.03443647,10.4668121 5.26620003,9.76452941 L1.23999023,6.65002441 C0.43658717,8.26043162 0,10.0753848 0,12 C0,13.9195484 0.444780743,15.7301709 1.23746264,17.3349879 L5.27698177,14.2678769 Z"
                        />
                      </svg>
                      Google
                    </Button>
                  </motion.div>
                </div>
              </div>
              
              <p className="mt-8 text-center text-sm text-gray-400">
                Don't have an account?{' '}
                <Link to="/register" className="font-medium text-primary hover:text-primary/80 transition">
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </PageTransition>
  );
};

export default Login;
