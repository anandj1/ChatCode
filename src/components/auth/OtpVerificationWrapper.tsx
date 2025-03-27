
import React from 'react';
import OtpVerification from './OtpVerification';
import { resendOtp, verifyOtp } from '@/api/auth';
import { useToast } from '@/hooks/use-toast';

interface OtpVerificationWrapperProps {
  email: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const OtpVerificationWrapper: React.FC<OtpVerificationWrapperProps> = ({ 
  email, 
  onSuccess, 
  onCancel 
}) => {
  const { toast } = useToast();

  const handleResend = async () => {
    try {
      await resendOtp(email);
      toast({
        title: "Success",
        description: "Verification code has been resent to your email",
        variant: "success", // Explicitly set to success
      });
      return Promise.resolve();
    } catch (error) {
      console.error("Error resending OTP:", error);
      toast({
        title: "Failed to resend code",
        description: "Please try again later",
        variant: "destructive",
      });
      return Promise.reject(error);
    }
  };

  const handleVerify = async (otpValue: string) => {
    try {
      const result = await verifyOtp({ email, otp: otpValue });
      
      if (result.token) {
        toast({
          title: "Email Verified",
          description: "Your email has been successfully verified. You can now log in.",
          variant: "success", // Explicitly set to success
        });
        onSuccess();
        return true;
      } else {
        toast({
          title: "Verification failed",
          description: "Invalid verification code. Please try again.",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      toast({
        title: "Verification failed",
        description: "Invalid verification code. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  return (
    <OtpVerification
      email={email}
      onSuccess={onSuccess}
      onCancel={onCancel}
      onResend={handleResend}
      onVerify={handleVerify}
    />
  );
};

export default OtpVerificationWrapper;