import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, Variants } from 'framer-motion';
import PageTransition from '@/components/transitions/PageTransition';
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
import { useAuth } from '@/context/AuthContext';
import { useOAuth } from '@/hooks/useOAuth';
import { useToast } from '@/hooks/use-toast';
import { Code, Eye, EyeOff, Github, Loader2 } from 'lucide-react';

import OtpVerificationWrapper from '../components/auth/OtpVerificationWrapper';

const formSchema = z.object({
  username: z.string()
    .min(3, { message: 'Username must be at least 3 characters' })
    .max(20, { message: 'Username must be less than 20 characters' })
    .regex(/^[a-zA-Z0-9_]+$/, { message: 'Username can only contain letters, numbers, and underscores' }),
  email: z.string()
    .email({ message: 'Please enter a valid email address' }),
  password: z.string()
    .min(8, { message: 'Password must be at least 8 characters' })
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
    .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
    .regex(/[0-9]/, { message: 'Password must contain at least one number' }),
});

type FormValues = z.infer<typeof formSchema>;
const logoVariants: Variants = {
  initial: { 
    scale: 1,
    rotate: 0,
    boxShadow: "0px 0px 0px rgba(94, 129, 244, 0)"
  },
  hover: { 
    scale: 1.1,
    rotate: 0,
    boxShadow: "0px 0px 20px rgba(94, 129, 244, 0.7)",
    transition: {
      duration: 0.3
    }
  },
  animate: { 
    scale: [1, 1.05, 1],
    boxShadow: [
      "0px 0px 0px rgba(94, 129, 244, 0.3)",
      "0px 0px 20px rgba(94, 129, 244, 0.7)",
      "0px 0px 0px rgba(94, 129, 244, 0.3)"
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      repeatType: "reverse"
    }
  }
};

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register: authRegister } = useAuth();
  const { githubLogin, googleLogin } = useOAuth();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState<string>('');
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
    },
  });
  
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    setGeneralError(null);
    
    try {
      const response = await authRegister(data.email, data.password, data.username);
      
      if ('error' in response) {
        setGeneralError(response.error);
        
        if (response.error.includes('email already exists')) {
          form.setError('email', { 
            type: 'manual',
            message: 'This email is already registered. Try logging in instead.'
          });
        } else if (response.error.includes('username is already taken')) {
          form.setError('username', {
            type: 'manual',
            message: 'This username is already taken. Please choose another one.'
          });
        }
        
        toast({
          title: "Registration failed",
          description: response.error,
          variant: "destructive",
        });
      } else {
        setRegisteredEmail(response.email);
        setShowOtpVerification(true);
        toast({
          title: "Verification Required",
          description: "Please check your email for the verification code.",
          variant: "default",
        });
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Registration failed. Please try again.';
      setGeneralError(errorMessage);
      
      toast({
        title: "Registration failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleOtpSuccess = () => {
    toast({
      title: "Success",
      description: "Your email has been verified. You can now log in.",
      variant: "success",
    });
    navigate('/login');
  };
 
  
  const handleOtpCancel = () => {
    setShowOtpVerification(false);
    setRegisteredEmail('');
  };
  
  if (showOtpVerification) {
    return (
      <PageTransition>
        <div className="min-h-screen flex items-center justify-center px-4 md:px-6 py-12 bg-background">
          <OtpVerificationWrapper
            email={registeredEmail}
            onSuccess={handleOtpSuccess}
            onCancel={handleOtpCancel}
          />
        </div>
      </PageTransition>
    );
  }
  
  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col items-center justify-center px-4 md:px-6 py-12 bg-gradient-to-b from-primary/5 to-background">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
          <Link to="/" className="flex items-center justify-center gap-4 text-3xl md:text-4xl font-semibold">
  <motion.div
    className="relative rounded-full overflow-hidden border-2 border-primary/30 p-2"
    initial="initial"
    animate="animate"
    whileHover="hover"
    variants={logoVariants}
  >
    <motion.div 
      className="absolute inset-0 bg-gradient-to-r from-primary/20 to-blue-700/20 rounded-full"
      animate={{
        rotate: [0, 360]
      }}
      transition={{
        duration: 20,
        repeat: Infinity,
        ease: "linear"
      }}
    />
    <div className="w-12 h-12 rounded-full overflow-hidden relative z-10 bg-black/20 backdrop-blur-sm flex items-center justify-center text-2xl">
      <motion.img 
        src="/favicon.png" 
        alt="ChatCode Logo" 
        className="w-10 h-10 object-contain"
        initial={{ opacity: 0.9 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      />
    </div>
  </motion.div>
  <span className="font-bold">ChatCode</span>
</Link>

          
            <h1 className="text-3xl font-bold mt-6">Create an account</h1>
            <p className="text-muted-foreground mt-2">
              Enter your information to create a new account
            </p>
          </div>
          
          {generalError && (
            <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md mb-6 text-sm">
              {generalError}
            </div>
          )}
          
          <div className="grid grid-cols-1 gap-4 mb-6">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button 
                variant="outline"
                className="w-full bg-[#24292e] hover:bg-[#2F353A] text-white border-gray-700 shadow-lg hover:shadow-xl transition-all"
                onClick={githubLogin}
                disabled={isSubmitting}
              >
                <Github className="mr-2 h-4 w-4" />
                Continue with GitHub
              </Button>
            </motion.div>
            
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button 
                variant="outline"
                className="w-full flex items-center justify-center bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 shadow-lg hover:shadow-xl transition-all"
                onClick={googleLogin}
                disabled={isSubmitting}
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
                Continue with Google
              </Button>
            </motion.div>
          </div>
          
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 bg-gradient-to-br from-slate-800/90 to-slate-900/90 p-6 rounded-lg border border-white/10 shadow-xl">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">Username</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="johndoe" 
                        {...field} 
                        disabled={isSubmitting}
                        className="bg-slate-800/50 border-slate-700 text-white placeholder:text-gray-500 focus-visible:ring-slate-600"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">Email</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="john.doe@example.com" 
                        {...field} 
                        disabled={isSubmitting}
                        className="bg-slate-800/50 border-slate-700 text-white placeholder:text-gray-500 focus-visible:ring-slate-600"
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
                    <FormLabel className="text-gray-300">Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          type={showPassword ? "text" : "password"} 
                          placeholder="••••••••" 
                          {...field} 
                          disabled={isSubmitting}
                          className="bg-slate-800/50 border-slate-700 text-white placeholder:text-gray-500 focus-visible:ring-slate-600"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={togglePasswordVisibility}
                          disabled={isSubmitting}
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
              
              <Button 
                type="submit" 
                className="w-full shadow-sm bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create account"
                )}
              </Button>
            </form>
          </Form>
          
          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link 
              to="/login" 
              className="font-medium text-primary hover:underline"
              tabIndex={isSubmitting ? -1 : undefined}
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </PageTransition>
  );
};

export default Register;