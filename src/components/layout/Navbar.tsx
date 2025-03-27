import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { motion, Variants } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';

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

const Navbar: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  return (
    <nav className="bg-background border-b border-border sticky top-0 z-50">
      <div className="container max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 text-xl font-semibold">
          <motion.div
            className="relative rounded-full overflow-hidden border-2 border-primary/30 p-1"
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
            <div className="w-8 h-8 rounded-full overflow-hidden relative z-10 bg-black/20 backdrop-blur-sm flex items-center justify-center">
              <motion.img 
                src="/favicon.png" 
                alt="ChatCode Logo" 
                className="w-6 h-6 object-contain"
                initial={{ opacity: 0.9 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1 }}
              />
            </div>
          </motion.div>
          ChatCode
        </Link>
        
        <div className="hidden md:flex items-center space-x-4">
          <Link to="/rooms" className="hover:text-primary transition-colors">Rooms</Link>
          <Link to="/about" className="hover:text-primary transition-colors">About</Link>
          <Link to="/contact" className="hover:text-primary transition-colors">Contact</Link>
          
          {isAuthenticated ? (
            <Button variant="outline" onClick={handleLogout}>Logout</Button>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link to="/register">
                <Button>Sign Up</Button>
              </Link>
            </>
          )}
        </div>
        
        <div className="md:hidden">
          <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {isMenuOpen && (
        <motion.div 
          className="px-4 py-3 border-b border-border md:hidden"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex flex-col space-y-3">
            <Link to="/rooms" className="hover:text-primary transition-colors block py-2">Rooms</Link>
            <Link to="/about" className="hover:text-primary transition-colors block py-2">About</Link>
            <Link to="/contact" className="hover:text-primary transition-colors block py-2">Contact</Link>
            
            {isAuthenticated ? (
              <Button variant="outline" onClick={handleLogout} className="w-full">Logout</Button>
            ) : (
              <>
                <Link to="/login" className="block">
                  <Button variant="ghost" className="w-full">Login</Button>
                </Link>
                <Link to="/register" className="block">
                  <Button className="w-full">Sign Up</Button>
                </Link>
              </>
            )}
          </div>
        </motion.div>
      )}
    </nav>
  );
};

export default Navbar;