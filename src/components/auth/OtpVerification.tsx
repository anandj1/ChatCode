
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { Clock, Check, Loader2 } from 'lucide-react';

interface OtpVerificationProps {
  email: string;
  onSuccess: () => void;
  onCancel: () => void;
  onResend: () => Promise<void>;
  onVerify: (otp: string) => Promise<boolean>;
}

const OtpVerification: React.FC<OtpVerificationProps> = ({ 
  email, 
  onSuccess, 
  onCancel, 
  onResend,
  onVerify 
}) => {
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [remainingTime, setRemainingTime] = useState(30); // 2 minutes
  const [canResend, setCanResend] = useState(false);
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>(Array(6).fill(null));
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  useEffect(() => {
    if (remainingTime <= 0) {
      setCanResend(true);
      return;
    }
    
    const timer = setTimeout(() => {
      setRemainingTime(prev => prev - 1);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [remainingTime]);
  
  useEffect(() => {
    if (inputRefs.current[activeIndex]) {
      inputRefs.current[activeIndex]?.focus();
    }
  }, [activeIndex]);
  
  const handleChange = (value: string, index: number) => {
    if (value.length > 1) {
      const pastedValue = value.slice(0, 6).split('');
      const newOtp = [...otp];
      
      pastedValue.forEach((char, idx) => {
        if (idx < 6) {
          newOtp[idx] = char;
        }
      });
      
      setOtp(newOtp);
      setActiveIndex(Math.min(pastedValue.length, 5));
    } else {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      
      if (value && index < 5) {
        setActiveIndex(index + 1);
      }
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      setActiveIndex(index - 1);
    } else if (e.key === 'ArrowLeft' && index > 0) {
      setActiveIndex(index - 1);
    } else if (e.key === 'ArrowRight' && index < 5) {
      setActiveIndex(index + 1);
    }
  };
  
  const handleResend = async () => {
    if (!canResend || isResending) return;
    
    setIsResending(true);
    try {
      await onResend();
      setOtp(Array(6).fill(''));
      setActiveIndex(0);
      setRemainingTime(120);
      setCanResend(false);
    } catch (error) {
      console.error("Error in handleResend:", error);
    } finally {
      setIsResending(false);
    }
  };
  
  const verifyOtp = async () => {
    const otpValue = otp.join('');
    
    if (otpValue.length < 6) {
      toast({
        title: "Incomplete OTP",
        description: "Please enter the full 6-digit code.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const success = await onVerify(otpValue);
      if (success) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error in verifyOtp:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card className="neo-blur border-primary/20 shadow-xl">
      <CardHeader>
        <CardTitle className="text-gradient">Verify Your Email</CardTitle>
        <CardDescription>
          We've sent a 6-digit verification code to <span className="font-medium text-foreground">{email}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-center space-x-2">
          {otp.map((digit, index) => (
            <motion.div 
              key={index} 
              className="relative"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Input
                type="text"
                inputMode="numeric"
                value={digit}
                onChange={(e) => handleChange(e.target.value, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className={`w-12 h-12 text-center text-xl bg-secondary/50 border-secondary ${activeIndex === index ? 'border-primary' : ''}`}
                maxLength={6}
                pattern="[0-9]*"
                ref={el => inputRefs.current[index] = el}
              />
              {activeIndex === index && (
                <motion.div 
                  className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded" 
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.3 }}
                />
              )}
            </motion.div>
          ))}
        </div>
        
        <div className="text-center">
          {!canResend ? (
            <motion.div
              className="flex items-center justify-center gap-2 text-sm text-muted-foreground"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Clock className="w-4 h-4" />
              <span>Resend code in <span className="font-medium text-foreground">{formatTime(remainingTime)}</span></span>
            </motion.div>
          ) : (
            <Button
              variant="ghost"
              className="p-0 h-auto text-sm text-primary hover:text-primary hover:bg-primary/10"
              onClick={handleResend}
              disabled={isLoading || isResending}
            >
              {isResending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Sending...
                </span>
              ) : (
                "Resend verification code"
              )}
            </Button>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-3">
        <motion.div 
          whileHover={{ scale: 1.02 }} 
          whileTap={{ scale: 0.98 }}
          className="w-full"
        >
          <Button
            className="w-full bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700"
            onClick={verifyOtp}
            disabled={otp.join('').length < 6 || isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Verifying...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                Verify Email
              </span>
            )}
          </Button>
        </motion.div>
        <Button
          variant="ghost"
          className="w-full hover:bg-secondary/50"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
      </CardFooter>
    </Card>
  );
};

export default OtpVerification;