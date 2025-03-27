
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, ArrowLeft, Loader2 } from 'lucide-react';
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
import { buildApiUrl } from '@/api/config';
import PageTransition from '@/components/transitions/PageTransition';

const formSchema = z.object({
  email: z.string().email('Please enter a valid email address')
});

type FormValues = z.infer<typeof formSchema>;

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: ''
    }
  });

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    
    try {
      console.log(`Sending forgot password request to ${buildApiUrl('auth/forgot-password')}`, data);
      
      const response = await fetch(buildApiUrl('auth/forgot-password'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      console.log('Forgot password response status:', response.status);
      const result = await response.json();
      console.log('Forgot password response data:', result);
      
      if (response.ok) {
        setIsSuccess(true);
        toast({
          title: "Reset link sent",
          description: "Check your email for the password reset link",
          variant: "success",
        });
      } else {
        toast({
          title: "Request failed",
          description: result.message || 'There was a problem sending the reset link',
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error requesting password reset:', error);
      toast({
        title: "Request failed",
        description: "There was a problem sending the reset link",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-primary/5 to-background">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-lg shadow-xl border border-white/10 backdrop-blur-sm overflow-hidden">
            <div className="p-8">
              <div className="space-y-2 text-center">
                <Link to="/login" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
                  <ArrowLeft size={16} className="mr-1" />
                  Back to Login
                </Link>
                
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-white/90 to-white/70 bg-clip-text text-transparent">Reset Your Password</h1>
                <p className="text-gray-400 text-sm">
                  Enter your email address and we'll send you a link to reset your password
                </p>
              </div>

              {isSuccess ? (
                <div className="space-y-4 text-center mt-6">
                  <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                    <Mail className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                  <h2 className="text-xl font-semibold text-white">Check Your Email</h2>
                  <p className="text-gray-400">
                    We've sent a password reset link to your email. The link will expire in 30 minutes.
                  </p>
                  <Button 
                    onClick={() => navigate('/login')} 
                    className="mt-4 w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white"
                  >
                    Return to Login
                  </Button>
                </div>
              ) : (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-6">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-300">Email</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter your email" 
                              {...field} 
                              disabled={isLoading}
                              autoComplete="email"
                              className="bg-slate-800/50 border-slate-700 text-white placeholder:text-gray-500 focus-visible:ring-slate-600"
                            />
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
                          Sending...
                        </>
                      ) : "Send Reset Link"}
                    </Button>
                  </form>
                </Form>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </PageTransition>
  );
};

export default ForgotPassword;