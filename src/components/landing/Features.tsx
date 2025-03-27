
import React from 'react';
import { Link } from 'react-router-dom';
import { Code, Video, MessageSquare, Users, Sparkles, Shield, Zap, Globe } from 'lucide-react';
import { useIntersectionObserver } from '@/utils/animations';
import { motion } from 'framer-motion';

const features = [
  {
    icon: <Code size={24} />,
    title: 'Real-time Code Collaboration',
    description: 'Write and edit code together in real-time with syntax highlighting, cursor tracking, and multiple language support.',
    image: 'https://images.unsplash.com/photo-1581472723648-909f4851d4ae?auto=format&fit=crop&q=80'
  },
  {
    icon: <Video size={24} />,
    title: 'HD Video Calls',
    description: 'Connect face-to-face with high-definition video calls and crystal-clear audio for seamless communication.',
    image: 'https://images.unsplash.com/photo-1609921212029-bb5a28e60960?auto=format&fit=crop&q=80'
  },
  {
    icon: <MessageSquare size={24} />,
    title: 'Integrated Chat',
    description: 'Share ideas, links and code snippets through the built-in chat with markdown support and file sharing.',
    image: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&q=80'
  },
  {
    icon: <Users size={24} />,
    title: 'Room Management',
    description: 'Create and join secure coding rooms with custom permissions, access controls, and organization options.',
    image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80'
  },
  {
    icon: <Sparkles size={24} />,
    title: 'AI Code Assistance',
    description: 'Leverage AI-powered code suggestions and error detection to boost productivity and fix issues faster.',
    image: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&q=80'
  },
  {
    icon: <Shield size={24} />,
    title: 'End-to-End Security',
    description: 'Your code and conversations stay protected with enterprise-grade security and encryption.',
    image: 'https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?auto=format&fit=crop&q=80'
  },
  {
    icon: <Zap size={24} />,
    title: 'Lightning Fast Performance',
    description: 'Engineered for speed with minimal latency for real-time collaboration that feels local.',
    image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80'
  },
  {
    icon: <Globe size={24} />,
    title: 'Cross-Platform Support',
    description: 'Works seamlessly across all modern browsers and operating systems - no downloads required.',
    image: 'https://images.unsplash.com/photo-1568952433726-3896e3881c65?auto=format&fit=crop&q=80'
  }
];

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

const Features: React.FC = () => {
  const featuresRef = useIntersectionObserver();
  
  return (
    <section id="features" className="py-20 md:py-32 bg-gradient-to-b from-secondary/30 to-background">
      <div className="container mx-auto px-4 md:px-8">
        <motion.div 
          className="text-center max-w-3xl mx-auto mb-16 md:mb-24"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <div className="inline-block text-primary font-medium mb-3 px-3 py-1 bg-primary/10 rounded-full">Features</div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">Everything you need for seamless collaboration</h2>
          <p className="text-lg text-muted-foreground">
            Our platform combines powerful tools for coding, communication, and collaboration in one elegant interface.
          </p>
        </motion.div>
        
        <motion.div 
          ref={featuresRef} 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          {features.map((feature, index) => (
            <motion.div 
              key={index}
              variants={item}
              className="bg-card rounded-lg border border-border shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 overflow-hidden group"
            >
              <div className="h-48 overflow-hidden">
                <img 
                  src={feature.image} 
                  alt={feature.title} 
                  className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                />
              </div>
              <div className="p-6">
                <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-5 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
        
        <motion.div 
          className="mt-16 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        >
          <div className="bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20 p-8 md:p-12 rounded-xl">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">Ready to experience real-time collaboration?</h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Join thousands of developers who use ChatCode for their collaborative coding needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link to="/register" className="inline-block px-6 py-3 bg-primary text-white font-medium rounded-md hover:bg-primary/90 transition-colors">
                  Get Started for Free
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link to="/about" className="inline-block px-6 py-3 bg-secondary text-foreground font-medium rounded-md hover:bg-secondary/80 transition-colors">
                  Learn More
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Features;
