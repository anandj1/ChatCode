
import React, { ReactNode, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

interface PageTransitionProps {
  children: ReactNode;
}

const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  const location = useLocation();
  const pageRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const element = pageRef.current;
    if (element) {
      element.style.opacity = '0';
      element.style.transform = 'translateY(10px)';
      
      const timeout = setTimeout(() => {
        element.style.transition = 'opacity 500ms ease, transform 500ms ease';
        element.style.opacity = '1';
        element.style.transform = 'translateY(0)';
      }, 50);
      
      return () => clearTimeout(timeout);
    }
  }, [location.pathname]);

  return (
    <div ref={pageRef} className="min-h-screen w-full">
      {children}
    </div>
  );
};

export default PageTransition;
