
import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import PageTransition from '@/components/transitions/PageTransition';
import { buildApiUrl } from '@/api/config';

const formSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
});

type FormValues = z.infer<typeof formSchema>;

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: '',
      confirmPassword: ''
    }
  });

  const onSubmit = async (data: FormValues) => {
    if (!token || !email) {
      toast({
        title: "Error",
        description: "Missing reset token or email. Please request a new password reset.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      console.log(`Sending reset password request to ${buildApiUrl('auth/reset-password')}`, {
        token,
        email,
        password: data.password
      });
      
      const response = await fetch(buildApiUrl('auth/reset-password'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token,
          email,
          password: data.password
        })
      });
      
      console.log('Reset password response status:', response.status);
      const result = await response.json();
      console.log('Reset password response data:', result);
      
      if (response.ok) {
        setIsSuccess(true);
        toast({
          title: "Password reset successful",
          description: "Your password has been reset. You can now log in with your new password.",
          variant: "success",
        });
        setTimeout(() => navigate('/login'), 3000);
      } else {
        toast({
          title: "Reset failed",
          description: result.message || 'Failed to reset password. Please try again.',
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      toast({
        title: "Reset failed",
        description: "There was a problem resetting your password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!token || !email) {
    return (
      <PageTransition>
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-background to-background/90">
          <div className="w-full max-w-md space-y-6 p-8 rounded-xl bg-gradient-to-br from-slate-800/90 to-slate-900/90 border border-white/10 shadow-xl">
            <div className="space-y-4 text-center">
              <h1 className="text-2xl font-bold">Invalid Reset Link</h1>
              <p className="text-muted-foreground">
                The password reset link appears to be invalid or expired. Please request a new password reset.
              </p>
              <Button 
                onClick={() => navigate('/forgot-password')} 
                className="mt-4 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white"
              >
                Request New Reset Link
              </Button>
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-primary/5 to-background">
        <div className="w-full max-w-md space-y-6 p-8 rounded-xl bg-gradient-to-br from-slate-800/90 to-slate-900/90 border border-white/10 shadow-xl">
          <div className="space-y-2 text-center">
            <Link to="/login" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft size={16} className="mr-1" />
              Back to Login
            </Link>
            
            <h1 className="text-2xl font-bold text-white">Reset Your Password</h1>
            <p className="text-gray-400 text-sm">
              Please enter your new password
            </p>
          </div>

          {isSuccess ? (
            <div className="space-y-4 text-center">
              <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-green-900/20">
                <svg
                  className="w-8 h-8 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-white">Password Reset Successful</h2>
              <p className="text-gray-400">
                Your password has been successfully reset. You will be redirected to the login page shortly.
              </p>
              <Button 
                onClick={() => navigate('/login')} 
                className="mt-4 w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white"
              >
                Go to Login
              </Button>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">New Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type={showPassword ? "text" : "password"} 
                            placeholder="••••••••" 
                            {...field} 
                            disabled={isLoading}
                            className="bg-slate-800/50 border-slate-700 text-white placeholder:text-gray-500 focus-visible:ring-slate-600"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowPassword(!showPassword)}
                            disabled={isLoading}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span className="sr-only">
                              {showPassword ? "Hide password" : "Show password"}
                            </span>
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Confirm Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type={showConfirmPassword ? "text" : "password"} 
                            placeholder="••••••••" 
                            {...field} 
                            disabled={isLoading}
                            className="bg-slate-800/50 border-slate-700 text-white placeholder:text-gray-500 focus-visible:ring-slate-600"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            disabled={isLoading}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span className="sr-only">
                              {showConfirmPassword ? "Hide password" : "Show password"}
                            </span>
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-primary-foreground"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Resetting...
                    </>
                  ) : "Reset Password"}
                </Button>
              </form>
            </Form>
          )}
        </div>
      </div>
    </PageTransition>
  );
};

export default ResetPassword;