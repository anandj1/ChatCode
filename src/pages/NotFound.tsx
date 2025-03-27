import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { HomeIcon, ArrowLeft, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background via-background/95 to-secondary/20">
      <div className="w-full max-w-md p-8 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute -top-28 -right-28 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-pulse-subtle"></div>
        <div className="absolute -bottom-32 -left-32 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float"></div>
        
        <div className="relative z-10 text-center space-y-6 backdrop-blur-sm bg-secondary/10 p-8 rounded-xl border border-border/30 shadow-lg">
          {/* Error code with glow effect */}
          <div className="flex justify-center">
            <div className="w-24 h-24 flex items-center justify-center rounded-full bg-secondary/30 border border-primary/20 mb-4">
              <AlertCircle size={40} className="text-primary animate-pulse-subtle" />
            </div>
          </div>
          
          <h1 className="text-5xl font-bold text-gradient animate-glow">404</h1>
          
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Oops! Room Not Found</h2>
            <p className="text-muted-foreground">
              The collaborative space you're looking for seems to have disappeared into the digital void.
            </p>
          </div>
          
          <div className=" justify-center mt-8">
          
            
            <Link to="/" className="w-full sm:w-auto">
              <Button 
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white w-full sm:w-auto h-12 px-6 text-base"
              >
                <HomeIcon size={18} className="mr-2.5" />
                Return Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;