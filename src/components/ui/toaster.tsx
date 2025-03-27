
import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        // Set different gradient styles based on variant
        let gradientStyle = "bg-gradient-to-r from-[#2A2A30] to-[#32323E] border border-gray-700/30 shadow-lg text-gray-100";
        
        // Always ensure proper styling based on variant
        if (variant === "destructive") {
          gradientStyle = "bg-gradient-to-r from-[#4B1113] to-[#621219] border border-red-700/50 shadow-lg text-white";
        } else if (variant === "success") {
          gradientStyle = "bg-gradient-to-r from-[#0F3320] to-[#1B4D33] border border-green-700/50 shadow-lg text-white";
        } else if (variant === "warning") {
          gradientStyle = "bg-gradient-to-r from-[#593B00] to-[#7C5000] border border-yellow-600/50 shadow-lg text-white";
        } else if (variant === "info") {
          gradientStyle = "bg-gradient-to-r from-[#0F2A4A] to-[#1A3F6D] border border-blue-600/50 shadow-lg text-white";
        }

        // Force success style based on title content if no variant is specified
        if (!variant || variant === "default") {
          if (title) {
            const titleLower = title.toString().toLowerCase();
            if (titleLower.includes("success") || 
                titleLower.includes("welcome") ||
                titleLower.includes("created") ||
                titleLower.includes("verified") ||
                titleLower.includes("copied") ||
                titleLower.includes("saved") ||
                titleLower.includes("updated") ||
                titleLower.includes("deleted")) {
              gradientStyle = "bg-gradient-to-r from-[#0F3320] to-[#1B4D33] border border-green-700/50 shadow-lg text-white";
              variant = "success";
            } else if (titleLower.includes("error") || 
                      titleLower.includes("failed") ||
                      titleLower.includes("invalid") ||
                      titleLower.includes("wrong")) {
              gradientStyle = "bg-gradient-to-r from-[#4B1113] to-[#621219] border border-red-700/50 shadow-lg text-white";
              variant = "destructive";
            }
          }
          
          if (description && !variant) {
            const descLower = description.toString().toLowerCase();
            if (descLower.includes("success")) {
              gradientStyle = "bg-gradient-to-r from-[#0F3320] to-[#1B4D33] border border-green-700/50 shadow-lg text-white";
              variant = "success";
            }
          }
        }
        
        return (
          <Toast 
            key={id} 
            {...props}
            className={gradientStyle}
            variant={variant}
          >
            <div className="grid gap-1">
              {title && <ToastTitle className="font-medium text-gray-100">{title}</ToastTitle>}
              {description && (
                <ToastDescription className="text-gray-300">{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose className="text-gray-300 hover:text-gray-100" />
          </Toast>
        )
      })}
      <ToastViewport className="top-0 left-1/2 -translate-x-1/2 flex max-h-screen flex-col-reverse p-4 sm:top-0 sm:left-1/2 sm:-translate-x-1/2 sm:flex-col md:max-w-[420px]" />
    </ToastProvider>
  )
}
