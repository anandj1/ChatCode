
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Index from '@/pages/Index';
import About from '@/pages/About';
import Contact from '@/pages/Contact';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Rooms from '@/pages/Rooms';
import Room from '@/pages/Room';
import NotFound from '@/pages/NotFound';
import OAuthCallback from '@/pages/OAuthCallback';
import { Toaster } from '@/components/ui/toaster';
import ForgotPassword from '@/pages/ForgotPassword';
import { AuthProvider } from '@/context/AuthContext';
import ResetPassword from '@/pages/ResetPassword';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/oauth-callback" element={<OAuthCallback />} />
          <Route path="/rooms" element={<Rooms />} />
          <Route path="/room/:roomId" element={<Room />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </Router>
    </AuthProvider>
  );
}

export default App;
