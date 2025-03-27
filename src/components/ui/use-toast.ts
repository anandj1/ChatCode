
import { useToast, toast } from "@/hooks/use-toast";

// Re-export with the proper variant types
const enhancedToast = {
  ...toast,
  success: (props: any) => toast({ ...props, variant: "success" }),
  error: (props: any) => toast({ ...props, variant: "destructive" }),
  warning: (props: any) => toast({ ...props, variant: "warning" }),
  info: (props: any) => toast({ ...props, variant: "info" })
};

export { useToast, enhancedToast as toast };