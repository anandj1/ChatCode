
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { Code, Code2, Terminal, Braces, TerminalSquare, Lock, Check } from 'lucide-react';

const Hero: React.FC = () => {
  const { isAuthenticated } = useAuth();
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.3
      } 
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };
  
  const codeEditorVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: 0.8, ease: "easeOut" }
    }
  };
  
  // Updated positioning for floating icons with more space between elements
  const floatingIcons = [
    { icon: <Code size={16} />, delay: 0, offsetX: -220, offsetY: -100 },
    { icon: <Braces size={16} />, delay: 0.2, offsetX: 220, offsetY: -80 },
    { icon: <Terminal size={16} />, delay: 0.4, offsetX: -200, offsetY: 100 },
    { icon: <Code2 size={16} />, delay: 0.6, offsetX: 210, offsetY: 90 },
    { icon: <TerminalSquare size={16} />, delay: 0.8, offsetX: 0, offsetY: -120 },
  ];
  
  return (
    <section className="relative py-28 lg:py-36 overflow-hidden">
      {/* Improved animated background elements with reduced opacity */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div 
          className="absolute top-40 -left-60 w-96 h-96 bg-primary/5 rounded-full filter blur-3xl"
          animate={{ 
            x: [0, 20, 0], 
            y: [0, 25, 0],
            opacity: [0.2, 0.3, 0.2]
          }}
          transition={{ 
            duration: 12, 
            repeat: Infinity,
            ease: "easeInOut" 
          }}
        />
        <motion.div 
          className="absolute bottom-40 -right-60 w-[32rem] h-[32rem] bg-blue-600/5 rounded-full filter blur-3xl"
          animate={{ 
            x: [0, -30, 0], 
            y: [0, -20, 0],
            opacity: [0.15, 0.25, 0.15]
          }}
          transition={{ 
            duration: 15, 
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />
        <motion.div 
          className="absolute -bottom-60 left-1/3 w-80 h-80 bg-purple-500/5 rounded-full filter blur-3xl"
          animate={{ 
            x: [0, 25, 0], 
            y: [0, -25, 0],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{ 
            duration: 18, 
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        />
      </div>
      
      <div className="container px-6 mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 items-center">
          <motion.div 
            className="lg:col-span-5 flex flex-col space-y-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants}>
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary mb-6">
                <motion.div
                  className="w-3 h-3 bg-primary rounded-full mr-2"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                Real-time collaboration for developers
              </div>
            </motion.div>
            
            <motion.h1 
              className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight"
              variants={itemVariants}
            >
              Code together, <span className="text-gradient glow-text">collaborate</span> in real-time
            </motion.h1>
            
            <motion.p 
              className="text-lg md:text-xl text-muted-foreground max-w-xl"
              variants={itemVariants}
            >
              ChatCode brings teams together with real-time collaborative coding, video chat, and instant messaging in one seamless platform.
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 pt-4"
              variants={itemVariants}
            >
              {isAuthenticated ? (
                <Link to="/rooms">
                  <Button size="lg" className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700 text-white shadow-lg shadow-primary/20">
                    Go to Rooms
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/register">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button size="lg" className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700 text-white shadow-lg shadow-primary/20 w-full sm:w-auto">
                        Get Started — It's Free
                      </Button>
                    </motion.div>
                  </Link>
                  <Link to="/login">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button variant="outline" size="lg" className="border-primary/50 text-primary hover:bg-primary/10 w-full sm:w-auto">
                        Sign In
                      </Button>
                    </motion.div>
                  </Link>
                </>
              )}
            </motion.div>
            
            <motion.div 
              className="flex flex-col gap-4 pt-6"
              variants={itemVariants}
            >
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="flex -space-x-3">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-semibold border-2 border-background shadow-md">JD</div>
                  <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-semibold border-2 border-background shadow-md">KM</div>
                  <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs font-semibold border-2 border-background shadow-md">AS</div>
                  <div className="w-8 h-8 rounded-full bg-fuchsia-500 flex items-center justify-center text-white text-xs font-semibold border-2 border-background shadow-md">+5</div>
                </div>
                <p>Join 500+ developers using ChatCode</p>
              </div>
              
              <div className="flex flex-wrap gap-4">
                {[
                  { text: "No Payments required", icon: <Check size={14} /> },
                  { text: "End-to-end encryption", icon: <Lock size={14} /> },
                  { text: "Unlimited collaborators", icon: <Check size={14} /> },
                  { text: "Create Private Rooms", icon: <Check size={14} /> }
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-1.5 text-sm text-muted-foreground bg-secondary/40 px-3 py-1.5 rounded-full">
                    <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                      {item.icon}
                    </div>
                    {item.text}
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
          
          <motion.div 
            className="lg:col-span-7 relative"
            variants={codeEditorVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Repositioned floating code elements to prevent overlapping */}
            {floatingIcons.map((icon, index) => (
              <motion.div
                key={index}
                className="absolute z-10 w-8 h-8 rounded-lg bg-secondary/80 border border-white/10 backdrop-blur-sm flex items-center justify-center text-primary shadow-lg"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ 
                  opacity: [0, 1, 0],
                  scale: [0.5, 1, 0.5],
                  x: [`calc(50% + ${icon.offsetX}px)`, `calc(50% + ${icon.offsetX + 20}px)`, `calc(50% + ${icon.offsetX}px)`],
                  y: [`calc(50% + ${icon.offsetY}px)`, `calc(50% + ${icon.offsetY - 20}px)`, `calc(50% + ${icon.offsetY}px)`],
                }}
                transition={{ 
                  duration: 10, 
                  delay: icon.delay,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                {icon.icon}
              </motion.div>
            ))}
            
            <div className="relative neo-blur rounded-xl shadow-2xl border border-white/10 overflow-hidden">
              <div className="p-2 border-b border-white/10 bg-secondary/30">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <div className="ml-2 text-xs font-semibold">Room: React Component Workshop</div>
                </div>
              </div>
              
              <div className="flex">
                <div className="bg-secondary/50 p-4 text-left font-mono text-xs overflow-auto h-[340px] w-full">
                  <div className="relative">
                    <pre className="text-blue-400">
                      <code>
{`import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

// A reusable progress indicator component
// that animates when the value changes
const ProgressIndicator = ({ value, max, color = 'blue' }) => {
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    // Calculate percentage
    const percentage = (value / max) * 100;
    setProgress(percentage);
  }, [value, max]);

  return (
    <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
      <motion.div 
        className={\`h-full bg-\${color}-500 dark:bg-\${color}-600\`}
        initial={{ width: 0 }}
        animate={{ width: \`\${progress}%\` }}
        transition={{ duration: 0.5 }}
      />
    </div>
  );
};

// Usage example with multiple colors
export const ProgressDemo = () => {
  const [values, setValues] = useState({
    coding: 25,
    design: 65,
    testing: 40
  });

  // Update values every 3 seconds for demo
  useEffect(() => {
    const timer = setInterval(() => {
      setValues({
        coding: Math.floor(Math.random() * 100),
        design: Math.floor(Math.random() * 100),
        testing: Math.floor(Math.random() * 100)
      });
    }, 3000);
    
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-4 p-4">
      <div>
        <label className="block mb-1">Coding Progress</label>
        <ProgressIndicator value={values.coding} max={100} color="blue" />
      </div>
      <div>
        <label className="block mb-1">Design Progress</label>
        <ProgressIndicator value={values.design} max={100} color="purple" />
      </div>
      <div>
        <label className="block mb-1">Testing Progress</label>
        <ProgressIndicator value={values.testing} max={100} color="green" />
      </div>
    </div>
  );
};`}
                      </code>
                    </pre>
                    
                    {/* Animated cursors to simulate real-time collaboration */}
                    <motion.div
                      className="absolute top-[172px] left-[320px] h-4 w-1 bg-blue-500"
                      animate={{ 
                        opacity: [1, 0.5, 1],
                        x: [0, 5, 0],
                      }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <div className="absolute -top-4 -left-1 text-xs text-blue-500 whitespace-nowrap">
                        <motion.span 
                          animate={{ opacity: [0, 1, 0] }}
                          transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                        >
                          typing...
                        </motion.span>
                      </div>
                    </motion.div>
                    <motion.div
                      className="absolute top-[235px] left-[180px] h-4 w-1 bg-green-500"
                      animate={{ 
                        opacity: [1, 0.5, 1],
                        y: [0, 5, 0],
                      }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                    >
                      <div className="absolute -top-4 -left-1 text-xs text-green-500 whitespace-nowrap">
                        <motion.span 
                          animate={{ opacity: [0, 1, 0] }}
                          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                        >
                          selecting...
                        </motion.span>
                      </div>
                    </motion.div>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-4 text-sm">
                    <div className="flex items-center">
                      <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs mr-2">JS</div>
                      <motion.span 
                        className="text-amber-400"
                        animate={{ opacity: [1, 0.8, 1] }}
                        transition={{ duration: 1.2, repeat: Infinity }}
                      >
                        John is typing...
                      </motion.span>
                    </div>
                  </div>
                </div>
                
                <div className="w-60 hidden lg:block bg-secondary/60 border-l border-white/10">
                  <div className="p-3 border-b border-white/10">
                    <h3 className="text-xs font-semibold text-center">Team Members</h3>
                  </div>
                  
                  <div className="p-3 space-y-3">
                    {[
                      { name: "You", avatar: "https://ui-avatars.com/api/?name=You&background=2563eb&color=fff", status: "Active" },
                      { name: "Rahul Sharma", avatar: "https://ui-avatars.com/api/?name=John+Smith&background=f59e0b&color=fff", status: "Typing..." },
                      { name: "Nidhi Johnson", avatar: "https://ui-avatars.com/api/?name=Kim+Lee&background=10b981&color=fff", status: "Active" },
                      { name: "James Garstang", avatar: "https://ui-avatars.com/api/?name=Alex+Chen&background=8b5cf6&color=fff", status: "Away" },
                    ].map((member, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="relative">
                          <img src={member.avatar} alt={member.name} className="w-8 h-8 rounded-full" />
                          <motion.div 
                            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ${
                              member.status === "Active" ? "bg-green-500" : 
                              member.status === "Typing..." ? "bg-amber-500" : "bg-gray-400"
                            } border-2 border-secondary`}
                            animate={member.status === "Typing..." ? { scale: [1, 1.2, 1] } : {}}
                            transition={{ duration: 1, repeat: Infinity }}
                          />
                        </div>
                        <div>
                          <div className="text-xs font-medium">{member.name}</div>
                          <div className="text-[10px] text-muted-foreground">{member.status}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="p-3 border-t border-white/10">
                    <div className="flex flex-col gap-2">
                      <div className="text-xs text-center text-muted-foreground">Active Voice Call</div>
                      <div className="grid grid-cols-2 gap-1">
                        {[
                          "https://ui-avatars.com/api/?name=You&background=2563eb&color=fff",
                          "https://ui-avatars.com/api/?name=Rahul+Sharma&background=f59e0b&color=fff",
                          "https://ui-avatars.com/api/?name=Nidhi+Johnson&background=10b981&color=fff",
                          "https://ui-avatars.com/api/?name=James+Garstang&background=8b5cf6&color=fff",
                        ].map((avatar, index) => (
                          <div key={index} className="aspect-video bg-black/60 rounded-md relative overflow-hidden">
                            <img src={avatar} className="object-cover opacity-70 w-full h-full" alt="User" />
                            {index === 0 && (
                              <motion.div 
                                className="absolute bottom-1 right-1 bg-primary rounded-full p-0.5"
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                                  <line x1="12" y1="19" x2="12" y2="23"></line>
                                  <line x1="8" y1="23" x2="16" y2="23"></line>
                                </svg>
                              </motion.div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <motion.div 
                className="p-3 border-t border-white/10 bg-secondary/30 flex justify-between items-center"
                whileHover={{ backgroundColor: "rgba(255,255,255,0.05)" }}
              >
                <div className="text-xs">
                  <span className="font-semibold">Room ID:</span> react-workshop-123
                </div>
                <motion.div 
                  className="text-xs text-primary font-medium cursor-pointer px-2 py-1 rounded hover:bg-primary/10"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Copy Invite Link
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
