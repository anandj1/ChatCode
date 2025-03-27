import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link' | 'default' | 'destructive' | 'success' | 'gradient' | 'github' | 'google';
  size?: 'sm' | 'md' | 'lg' | 'icon' | 'default';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  asChild?: boolean;
  gradientFrom?: string;
  gradientTo?: string;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    children, 
    variant = 'primary', 
    size = 'md', 
    isLoading, 
    leftIcon, 
    rightIcon, 
    fullWidth, 
    disabled,
    gradientFrom,
    gradientTo,
    ...props 
  }, ref) => {
    
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/40 disabled:opacity-70 disabled:cursor-not-allowed';
    
    const variants = {
      primary: 'bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/95',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/90',
      outline: 'border border-input bg-transparent hover:bg-accent/10 text-foreground',
      ghost: 'hover:bg-accent/10 text-foreground',
      link: 'text-primary underline-offset-4 hover:underline p-0 h-auto',
      default: 'bg-primary text-primary-foreground hover:bg-primary/90',
      destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      success: 'bg-green-600 text-white hover:bg-green-700',
      gradient: gradientFrom && gradientTo 
        ? `bg-gradient-to-r from-[${gradientFrom}] to-[${gradientTo}] text-white hover:shadow-md` 
        : 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:from-primary/90 hover:to-primary/70',
      github: 'bg-gradient-to-r from-[#2A2E33] to-[#24292E] hover:from-[#24292E] hover:to-[#2F3337] text-white border-none shadow-md',
      google: 'bg-gradient-to-r from-[#4285F4] to-[#3578E5] hover:from-[#3578E5] hover:to-[#4285F4] text-white border-none shadow-md'
    };
    
    const sizes = {
      sm: 'h-9 px-3 text-sm rounded-md',
      md: 'h-10 px-4 py-2 rounded-md',
      lg: 'h-11 px-6 text-base rounded-md',
      icon: 'h-10 w-10 rounded-md',
      default: 'h-10 px-4 py-2 rounded-md',
    };
    
    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant as keyof typeof variants],
          sizes[size as keyof typeof sizes],
          fullWidth && 'w-full',
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        
        {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
        
        {children}
        
        {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';

export const buttonVariants = (props: ButtonProps = {}) => {
  const { 
    variant = 'primary', 
    size = 'md', 
    className, 
    fullWidth,
    gradientFrom,
    gradientTo
  } = props;
  
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/40 disabled:opacity-70 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/95',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/90',
    outline: 'border border-input bg-transparent hover:bg-accent/10 text-foreground',
    ghost: 'hover:bg-accent/10 text-foreground',
    link: 'text-primary underline-offset-4 hover:underline p-0 h-auto',
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
    success: 'bg-green-600 text-white hover:bg-green-700',
    gradient: gradientFrom && gradientTo 
      ? `bg-gradient-to-r from-[${gradientFrom}] to-[${gradientTo}] text-white hover:shadow-md` 
      : 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:from-primary/90 hover:to-primary/70',
    github: 'bg-gradient-to-r from-[#2A2E33] to-[#24292E] hover:from-[#24292E] hover:to-[#2F3337] text-white border-none shadow-md',
    google: 'bg-gradient-to-r from-[#4285F4] to-[#3578E5] hover:from-[#3578E5] hover:to-[#4285F4] text-white border-none shadow-md'
  };
  
  const sizes = {
    sm: 'h-9 px-3 text-sm rounded-md',
    md: 'h-10 px-4 py-2 rounded-md',
    lg: 'h-11 px-6 text-base rounded-md',
    icon: 'h-10 w-10 rounded-md',
    default: 'h-10 px-4 py-2 rounded-md',
  };
  
  return cn(
    baseStyles,
    variants[variant as keyof typeof variants],
    sizes[size as keyof typeof sizes],
    fullWidth && 'w-full',
    className
  );
};

export default Button;