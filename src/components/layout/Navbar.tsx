
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Code, Menu, X } from 'lucide-react';

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
        <Link to="/" className="flex items-center gap-2 text-xl font-semibold">
          <motion.div 
            whileHover={{ scale: 1.1 }}
            className="flex items-center justify-center w-8 h-8 rounded-md bg-primary text-primary-foreground"
          >
            <Code className="h-4 w-4" />
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