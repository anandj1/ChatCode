import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import PageTransition from '@/components/transitions/PageTransition';
import Hero from '@/components/landing/Hero';
import Features from '@/components/landing/Features';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { motion, useAnimation } from 'framer-motion';
import { Code, MessageSquare, Video, Users, Lightbulb, Zap, Shield, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Index: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const controls = useAnimation();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/rooms');
    }
  }, [isAuthenticated, navigate]);

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('/rooms');
    } else {
      toast({
        title: "Login required",
        description: "You need to login to create or join rooms",
        variant: "default",
      });
      navigate('/login');
    }
  };

  useEffect(() => {
    // Show a welcome message with a delay
    setTimeout(() => {
      toast({
        title: "Welcome to ChatCode",
        description: "Explore real-time collaboration features designed for developers. Sign up to get started!",
      });
    }, 1500);
    
    // Start animations
    controls.start({
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.2,
      },
    });
  }, [controls]);

  return (
    <PageTransition>
      <div className="flex flex-col min-h-screen bg-background">
        <Navbar />
        
        <motion.main 
          className="flex-grow"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Hero />
          <Features />
          
          {/* How It Works Section - Improved spacing and visual hierarchy */}
          <section className="py-24 md:py-32 relative overflow-hidden">
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-900/10 to-primary/5"></div>
              <div className="absolute -top-60 -right-60 w-[30rem] h-[30rem] bg-primary/10 rounded-full filter blur-[100px]"></div>
              <div className="absolute -bottom-60 -left-60 w-[30rem] h-[30rem] bg-blue-500/10 rounded-full filter blur-[100px]"></div>
            </div>
            
            <div className="container mx-auto px-6 relative z-10">
              <motion.div 
                className="text-center max-w-3xl mx-auto mb-20"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
              >
                <div className="inline-block text-primary font-medium mb-4 px-4 py-1.5 bg-primary/10 rounded-full">How It Works</div>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-gradient">Collaboration made simple</h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Our platform makes it easy to connect, code, and communicate in real-time with your team, no matter where they are in the world.
                </p>
              </motion.div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-16">
                <motion.div 
                  className="flex flex-col items-center text-center bg-secondary/20 backdrop-blur-sm p-8 rounded-xl border border-white/5 hover:border-primary/20 transition-all duration-300"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  whileHover={{ y: -8, boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)" }}
                >
                  <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6 shadow-md shadow-primary/10">
                    <Code size={28} />
                  </div>
                  <h3 className="text-xl font-bold mb-4">1. Create a code room</h3>
                  <p className="text-muted-foreground">
                    Create a new room or join an existing one with a simple link. No downloads required, just share and start coding.
                  </p>
                </motion.div>
                
                <motion.div 
                  className="flex flex-col items-center text-center bg-secondary/20 backdrop-blur-sm p-8 rounded-xl border border-white/5 hover:border-primary/20 transition-all duration-300"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  whileHover={{ y: -8, boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)" }}
                >
                  <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6 shadow-md shadow-primary/10">
                    <Video size={28} />
                  </div>
                  <h3 className="text-xl font-bold mb-4">2. Connect with video</h3>
                  <p className="text-muted-foreground">
                    Start a video call with HD quality to see and hear your teammates in real-time while you work together.
                  </p>
                </motion.div>
                
                <motion.div 
                  className="flex flex-col items-center text-center bg-secondary/20 backdrop-blur-sm p-8 rounded-xl border border-white/5 hover:border-primary/20 transition-all duration-300"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  whileHover={{ y: -8, boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)" }}
                >
                  <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6 shadow-md shadow-primary/10">
                    <MessageSquare size={28} />
                  </div>
                  <h3 className="text-xl font-bold mb-4">3. Collaborate seamlessly</h3>
                  <p className="text-muted-foreground">
                    Code together in real-time, chat, share files, and solve problems as a team with intuitive tools.
                  </p>
                </motion.div>
              </div>
              
              <motion.div 
                className="mt-20 text-center"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
              >
                <div className="inline-block">
                  <Link to="/register">
                    <Button size="lg" className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700 text-white shadow-lg shadow-primary/20 px-8 py-6 text-lg">
                      Try It Now
                    </Button>
                  </Link>
                </div>
              </motion.div>
            </div>
          </section>
          
          {/* Features Showcase Section */}
          <section className="py-24 md:py-32 bg-secondary/10">
            <div className="container mx-auto px-6">
              <motion.div 
                className="text-center max-w-3xl mx-auto mb-20"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
              >
                <div className="inline-block text-primary font-medium mb-4 px-4 py-1.5 bg-primary/10 rounded-full">Features</div>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-gradient">Everything you need for seamless collaboration</h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Our platform combines powerful tools for coding, communication, and collaboration in one elegant interface.
                </p>
              </motion.div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                  {
                    icon: <Code size={24} />,
                    title: "Real-time Code Collaboration",
                    description: "Write and edit code together in real-time with syntax highlighting, cursor tracking, and multiple language support."
                  },
                  {
                    icon: <Video size={24} />,
                    title: "HD Video Calls",
                    description: "Connect face-to-face with high-definition video calls and crystal-clear audio for seamless communication."
                  },
                  {
                    icon: <MessageSquare size={24} />,
                    title: "Integrated Chat",
                    description: "Discuss ideas and share links without switching platforms, keeping conversations contextual to your code."
                  },
                  {
                    icon: <Users size={24} />,
                    title: "Unlimited Teammates",
                    description: "Invite as many team members as you need with no restrictions on collaboration room size."
                  },
                  {
                    icon: <Lightbulb size={24} />,
                    title: "AI Code Suggestions",
                    description: "Get intelligent code completion and suggestions powered by advanced AI to boost your productivity."
                  },
                  {
                    icon: <Zap size={24} />,
                    title: "Blazing Fast Performance",
                    description: "Experience minimal latency and high performance even with complex code files and multiple users."
                  },
                  {
                    icon: <Shield size={24} />,
                    title: "Secure Collaboration",
                    description: "End-to-end encrypted communication and secure code storage protect your intellectual property."
                  },
                  {
                    icon: <Globe size={24} />,
                    title: "Works Everywhere",
                    description: "Our platform works across all major browsers and operating systems without any downloads required."
                  }
                ].map((feature, index) => (
                  <motion.div 
                    key={index}
                    className="glassmorphism p-8 rounded-xl flex flex-col h-full"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                    whileHover={{ y: -5, boxShadow: "0 15px 30px rgba(0, 0, 0, 0.15)" }}
                  >
                    <div className="w-14 h-14 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-5 shadow-md shadow-primary/10">
                      {feature.icon}
                    </div>
                    <h3 className="text-lg font-semibold mb-3">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
          
          {/* Testimonials Section */}
          <section className="py-24 md:py-32 relative overflow-hidden">
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-purple-900/10 to-primary/5"></div>
              <div className="absolute -top-60 -left-60 w-[30rem] h-[30rem] bg-purple-500/10 rounded-full filter blur-[100px]"></div>
              <div className="absolute -bottom-60 -right-60 w-[30rem] h-[30rem] bg-primary/10 rounded-full filter blur-[100px]"></div>
            </div>
            
            <div className="container mx-auto px-6 relative z-10">
              <motion.div 
                className="text-center max-w-3xl mx-auto mb-20"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
              >
                <div className="inline-block text-primary font-medium mb-4 px-4 py-1.5 bg-primary/10 rounded-full">Testimonials</div>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-gradient">Loved by developers worldwide</h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  See what our users have to say about their experience with ChatCode.
                </p>
              </motion.div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                {[
                  {
                    quote: "ChatCode has transformed how our remote team collaborates. The real-time coding and video features are game-changers for our workflow efficiency.",
                    author: "Sarah Jenkins",
                    role: "Senior Developer at TechFlow",
                    avatar: "https://ui-avatars.com/api/?name=Sarah+Jenkins&background=random"
                  },
                  {
                    quote: "The seamless integration of code editing, video calls, and chat in one platform has boosted our productivity by at least 30%. It's become indispensable.",
                    author: "Michael Rodriguez",
                    role: "Tech Lead at Innovate Inc",
                    avatar: "https://ui-avatars.com/api/?name=Michael+Rodriguez&background=random"
                  },
                  {
                    quote: "As a coding instructor, ChatCode gives me the perfect environment to teach and mentor students in real-time. The interface is intuitive and performance is stellar.",
                    author: "Aisha Nair",
                    role: "Code Instructor at CodeAcademy",
                    avatar: "https://ui-avatars.com/api/?name=Aisha+Nair&background=random"
                  }
                ].map((testimonial, index) => (
                  <motion.div 
                    key={index}
                    className="glassmorphism p-8 rounded-xl"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    whileHover={{ scale: 1.02, boxShadow: "0 15px 30px rgba(0, 0, 0, 0.15)" }}
                  >
                    <div className="flex flex-col h-full">
                      <div className="mb-5 text-primary">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className="text-xl">★</span>
                        ))}
                      </div>
                      <p className="italic mb-8 flex-grow text-base leading-relaxed">{testimonial.quote}</p>
                      <div className="flex items-center">
                        <img 
                          src={testimonial.avatar} 
                          alt={testimonial.author} 
                          className="w-12 h-12 rounded-full mr-4 border-2 border-primary/30 shadow-md"
                        />
                        <div>
                          <h4 className="font-semibold">{testimonial.author}</h4>
                          <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Call to Action */}
          <section className="py-24 md:py-32 relative overflow-hidden">
            <div className="absolute inset-0 z-0">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-900/30 to-primary/30"></div>
              <div className="absolute inset-0 bg-[url('https://ui-avatars.com/api/?background=1d4ed8&color=dbeafe&name=Pattern')] opacity-5 bg-repeat bg-[length:60px_60px]"></div>
            </div>
            
            <div className="container mx-auto px-6 relative z-10">
              <motion.div 
                className="max-w-4xl mx-auto text-center"
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
              >
                <h2 className="text-3xl md:text-5xl font-bold mb-8 text-gradient">Ready to transform how your team collaborates?</h2>
                <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
                  Join thousands of developers who are coding, communicating, and creating together on ChatCode.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-6 justify-center">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                    <Link to="/register">
                      <Button size="lg" className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700 text-white shadow-lg shadow-primary/20 w-full sm:w-auto px-8 py-6 text-lg">
                        Get Started — It's Free
                      </Button>
                    </Link>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                    <Link to="/rooms">
                      <Button variant="outline" size="lg" className="border-primary/50 text-primary hover:bg-primary/10 w-full sm:w-auto px-8 py-6 text-lg">
                        Explore Rooms
                      </Button>
                    </Link>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </section>
        </motion.main>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <Footer />
        </motion.div>
      </div>
    </PageTransition>
  );
};

export default Index;