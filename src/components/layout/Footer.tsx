import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Github, Linkedin, Mail, Twitter } from 'lucide-react';

// Corrected from GitHub to Github (proper case for the import)

const Footer: React.FC = () => {
  return (
    <footer className="bg-secondary/10 py-12">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* First Section - About */}
          <div>
            <h4 className="text-lg font-semibold mb-4">About ChatCode</h4>
            <p className="text-sm text-muted-foreground">
              ChatCode is a real-time collaboration platform for developers. Code together, chat, and share ideas in one seamless environment.
            </p>
          </div>

          {/* Second Section - Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>
                <Link to="/" className="hover:text-primary transition-colors duration-200">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/rooms" className="hover:text-primary transition-colors duration-200">
                  Rooms
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-primary transition-colors duration-200">
                  Register
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-primary transition-colors duration-200">
                  Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Third Section - Contact & Social */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Connect With Us</h4>
            <div className="flex items-center space-x-4 mb-4">
              <a href="https://github.com/anandj1/" className="text-gray-400 hover:text-primary transition-colors duration-200">
                <Github className="h-5 w-5" />
              </a>
              <a href="https://www.linkedin.com/in/anandjsharma/?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app" className="text-gray-400 hover:text-primary transition-colors duration-200">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="anandj12215@gmail.com" className="text-gray-400 hover:text-primary transition-colors duration-200">
                <Mail className="h-5 w-5" />
              </a>
            </div>
            <p className="text-sm text-muted-foreground">
              Email: anand2025sharma@gmail.com
            </p>
          </div>
        </div>

        {/* Copyright Section */}
        <div className="mt-12 text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} ChatCode. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
