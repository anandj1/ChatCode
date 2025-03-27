
import React from 'react';
import PageTransition from '@/components/transitions/PageTransition';
import Navbar from '@/components/layout/Navbar';
import { Separator } from '@/components/ui/separator';
import { Code, Users, Monitor, Sparkles, CodeXml, MessageSquare, Globe, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

const About: React.FC = () => {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <Navbar />
        
        <div className="container mx-auto max-w-5xl px-6 py-12 md:py-24">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <div className="flex justify-center items-center gap-3 mb-4">
              <motion.div 
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="bg-primary/10 p-3 rounded-lg"
              >
                <Code size={32} className="text-primary" />
              </motion.div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gradient">About ChatCode</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              A revolutionary platform for real-time code collaboration with integrated video and text chat.
            </p>
          </motion.div>
          
          <Separator className="my-12" />
          
          <div className="mb-16">
            <motion.h2 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-3xl font-bold mb-8 text-gradient"
            >
              Our Mission
            </motion.h2>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="glassmorphism p-8 rounded-xl"
            >
              <p className="text-lg leading-relaxed mb-4">
                At ChatCode, we believe in breaking down barriers to collaborative coding. Our mission is to create 
                an environment where developers, educators, and students can connect, collaborate, and learn together 
                in real time, regardless of their physical location.
              </p>
              <p className="text-lg leading-relaxed">
                We're committed to providing a seamless, intuitive platform that combines the best aspects of code editing, 
                video conferencing, and text communication, enabling truly effective remote pair programming and knowledge sharing.
              </p>
            </motion.div>
          </div>
          
          <Separator className="my-12" />
          
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="mb-16"
          >
            <h2 className="text-3xl font-bold mb-8 text-gradient">Key Features</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div variants={item} className="bg-secondary/10 p-6 rounded-xl border border-border">
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <CodeXml size={24} className="text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Real-time Code Editor</h3>
                <p className="text-muted-foreground">
                  Collaborate on code with syntax highlighting and real-time updates across all connected users.
                </p>
              </motion.div>
              
              <motion.div variants={item} className="bg-secondary/10 p-6 rounded-xl border border-border">
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Users size={24} className="text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Integrated Video Chat</h3>
                <p className="text-muted-foreground">
                  See and hear your collaborators with our built-in video conferencing system.
                </p>
              </motion.div>
              
              <motion.div variants={item} className="bg-secondary/10 p-6 rounded-xl border border-border">
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <MessageSquare size={24} className="text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Text Chat</h3>
                <p className="text-muted-foreground">
                  Exchange messages, code snippets, and links through our integrated chat system.
                </p>
              </motion.div>
              
              <motion.div variants={item} className="bg-secondary/10 p-6 rounded-xl border border-border">
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Globe size={24} className="text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Multi-language Support</h3>
                <p className="text-muted-foreground">
                  Work with a variety of programming languages with specialized syntax highlighting.
                </p>
              </motion.div>
            </div>
          </motion.div>
          
          <Separator className="my-12" />
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mb-16"
          >
            <h2 className="text-3xl font-bold mb-8 text-gradient">Our Technology Stack</h2>
            
            <div className="glassmorphism p-8 rounded-xl">
              <p className="text-lg mb-6">
                ChatCode is built with cutting-edge technologies to ensure a smooth, responsive experience:
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4">
                  <div className="h-16 w-16 mx-auto bg-secondary/20 rounded-full flex items-center justify-center mb-2">
                    <span className="text-2xl font-bold text-primary">R</span>
                  </div>
                  <p className="font-medium">React</p>
                </div>
                <div className="text-center p-4">
                  <div className="h-16 w-16 mx-auto bg-secondary/20 rounded-full flex items-center justify-center mb-2">
                    <span className="text-2xl font-bold text-primary">N</span>
                  </div>
                  <p className="font-medium">Node.js</p>
                </div>
                <div className="text-center p-4">
                  <div className="h-16 w-16 mx-auto bg-secondary/20 rounded-full flex items-center justify-center mb-2">
                    <span className="text-2xl font-bold text-primary">S</span>
                  </div>
                  <p className="font-medium">Socket.io</p>
                </div>
                <div className="text-center p-4">
                  <div className="h-16 w-16 mx-auto bg-secondary/20 rounded-full flex items-center justify-center mb-2">
                    <span className="text-2xl font-bold text-primary">W</span>
                  </div>
                  <p className="font-medium">WebRTC</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
};

export default About;
