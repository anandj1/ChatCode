import React, { useState } from 'react';
import PageTransition from '@/components/transitions/PageTransition';
import Navbar from '@/components/layout/Navbar';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { Mail, MessageSquare, MapPin, Phone, Send, CheckCircle } from 'lucide-react';
import { sendContactForm } from '@/lib/api';

const Contact: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !message) {
      toast({
        title: "Error",
        description: "Please fill out all fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await sendContactForm({ name, email, message });
      
      if (response.success) {
        setIsSubmitted(true);
        toast({
          title: "Message sent",
          description: "We'll get back to you as soon as possible.",
        });

        // Reset form
        setName('');
        setEmail('');
        setMessage('');

        setTimeout(() => {
          setIsSubmitted(false);
        }, 3000);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
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
                <Mail size={32} className="text-primary" />
              </motion.div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gradient">Contact Us</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Have questions or feedback? We'd love to hear from you.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h2 className="text-2xl font-bold mb-6 text-gradient">Get in Touch</h2>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail size={20} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-1">Email</h3>
                    <p className="text-muted-foreground">anand2025sharma@gmail.com</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin size={20} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-1">Address</h3>
                    <p className="text-muted-foreground">
                      123 Innovation Drive<br />
                      Tech Valley, Pune 411016<br />
                      Maharashtra, India
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Phone size={20} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-1">Phone</h3>
                    <p className="text-muted-foreground">+91 (987) 654-3210</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MessageSquare size={20} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-1">Support Hours</h3>
                    <p className="text-muted-foreground">
                      Monday - Friday<br />
                      9:00 AM - 6:00 PM IST
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <h2 className="text-2xl font-bold mb-6 text-gradient">Send a Message</h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-1">Name</label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full"
                    disabled={isSubmitting || isSubmitted}
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your email address"
                    className="w-full"
                    disabled={isSubmitting || isSubmitted}
                  />
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium mb-1">Message</label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Your message"
                    className="w-full min-h-[150px]"
                    disabled={isSubmitting || isSubmitted}
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isSubmitting || isSubmitted}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                      Sending...
                    </>
                  ) : isSubmitted ? (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Message Sent
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            </motion.div>
          </div>
          
          <Separator className="my-12" />
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="text-center"
          >
            <h2 className="text-2xl font-bold mb-4">Connect with Us</h2>
            <p className="text-muted-foreground mb-6">
              Follow us on social media for updates and coding tips
            </p>
            
            <div className="flex justify-center gap-4">
              <motion.a 
                href="#" 
                whileHover={{ scale: 1.1 }}
                className="h-12 w-12 rounded-full bg-secondary/30 flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                </svg>
              </motion.a>
              
              <motion.a 
                href="#" 
                whileHover={{ scale: 1.1 }}
                className="h-12 w-12 rounded-full bg-secondary/30 flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                </svg>
              </motion.a>
              
              <motion.a 
                href="#" 
                whileHover={{ scale: 1.1 }}
                className="h-12 w-12 rounded-full bg-secondary/30 flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
                </svg>
              </motion.a>
              
              <motion.a 
                href="#" 
                whileHover={{ scale: 1.1 }}
                className="h-12 w-12 rounded-full bg-secondary/30 flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h7v7h-7z"></path>
                  <path d="M2 14h7v7H2z"></path>
                  <path d="m22 10-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 10"></path>
                </svg>
              </motion.a>
            </div>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
};

export default Contact;