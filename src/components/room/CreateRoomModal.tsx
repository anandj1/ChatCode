
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Users, Copy, Check, Code, Loader2, Lock, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { buildApiUrl } from '@/api/config';
import { useAuth } from '@/context/AuthContext';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (room: any) => void;
}

const CreateRoomModal: React.FC<CreateRoomModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [roomName, setRoomName] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [roomId, setRoomId] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [generatePassword, setGeneratePassword] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, user, token } = useAuth();
  const { toast } = useToast();
  
  // Generate a random password when isPrivate is toggled
  useEffect(() => {
    if (isPrivate && generatePassword) {
      const randomPassword = Math.random().toString(36).slice(-8);
      setPassword(randomPassword);
      setGeneratePassword(false);
    }
  }, [isPrivate, generatePassword]);
  
  // Reset state when modal is closed
  useEffect(() => {
    if (!isOpen) {
      // Reset form after modal is closed
      setTimeout(() => {
        setStep(1);
        setRoomName('');
        setLanguage('javascript');
        setRoomId('');
        setError('');
        setIsPrivate(false);
        setPassword('');
        setShowPassword(false);
      }, 300); // Small delay to prevent visual glitches
    }
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    if (!roomName.trim()) {
      setError('Room name cannot be empty');
      setIsLoading(false);
      return;
    }
    
    if (isPrivate && !password.trim()) {
      setError('Password is required for private rooms');
      setIsLoading(false);
      return;
    }
    
    try {
      console.log("Creating room with token:", token?.substring(0, 10) + "...");
      
      const response = await fetch(buildApiUrl('rooms'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: roomName,
          language: language,
          isPrivate: isPrivate,
          password: isPrivate ? password : null
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        console.log("Room created successfully:", data);
        setRoomId(data._id || data.id);
        if (onSuccess) onSuccess(data);
        setStep(2);
        
        // If private room, show success toast with privacy info
        if (isPrivate) {
          toast({
            title: "Private Room Created",
            description: "Your password-protected room has been created successfully.",
            variant: "success",
          });
        } else {
          toast({
            title: "Room Created",
            description: "Your coding room has been created successfully.",
            variant: "success",
          });
        }
      } else {
        console.error("Room creation failed:", data);
        setError(data.message || 'Failed to create room. Please try again.');
        toast({
          title: "Room creation failed",
          description: data.message || "There was an error creating your room.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Room creation error:", error);
      setError('Connection error. Please try again.');
      toast({
        title: "Room creation failed",
        description: "There was an error creating your room. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const copyRoomLink = () => {
    const link = `${window.location.origin}/room/${roomId}`;
    navigator.clipboard.writeText(link);
    setIsCopied(true);
    
    toast({
      title: "Link copied",
      description: "Room link copied to clipboard",
      variant: "success",
    });
    
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };
  
  const joinRoom = () => {
    navigate(`/room/${roomId}`);
    onClose();
  };
  
  const handleGeneratePassword = () => {
    setGeneratePassword(true);
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-background rounded-lg shadow-lg w-full max-w-md relative overflow-hidden animate-scale"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 inset-x-0 h-1.5 bg-primary"></div>
        
        <div className="flex justify-between items-center p-6 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary/10 text-primary">
              {step === 1 ? <Users size={18} /> : <Code size={18} />}
            </div>
            <h2 className="text-xl font-semibold">
              {step === 1 ? 'Create a Room' : 'Room Created'}
            </h2>
          </div>
          <button 
            className="text-muted-foreground hover:text-foreground transition-colors"
            onClick={onClose}
            disabled={isLoading}
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
          {step === 1 ? (
            <form onSubmit={handleCreateRoom}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1.5" htmlFor="roomName">
                  Room Name
                </label>
                <input
                  type="text"
                  id="roomName"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background ${
                    error ? 'border-destructive' : 'border-border'
                  }`}
                  placeholder="My Coding Session"
                  value={roomName}
                  onChange={(e) => {
                    setRoomName(e.target.value);
                    if (error) setError('');
                  }}
                  required
                  disabled={isLoading}
                />
                {error && (
                  <p className="text-xs text-destructive mt-1.5">
                    {error}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1.5">
                  Give your room a descriptive name to help others identify it.
                </p>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1.5" htmlFor="language">
                  Programming Language
                </label>
                <Select value={language} onValueChange={setLanguage} disabled={isLoading}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="javascript">JavaScript</SelectItem>
                    <SelectItem value="typescript">TypeScript</SelectItem>
                    <SelectItem value="python">Python</SelectItem>
                    <SelectItem value="java">Java</SelectItem>
                    <SelectItem value="csharp">C#</SelectItem>
                    <SelectItem value="cpp">C++</SelectItem>
                    <SelectItem value="php">PHP</SelectItem>
                    <SelectItem value="ruby">Ruby</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="mb-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="private-toggle" className="text-sm font-medium">
                      Private Room
                    </Label>
                  </div>
                  <Switch
                    id="private-toggle"
                    checked={isPrivate}
                    onCheckedChange={setIsPrivate}
                    disabled={isLoading}
                  />
                </div>
                
                {isPrivate && (
                  <div className="bg-secondary/10 p-3 rounded-md border border-border/50">
                    <p className="text-xs text-muted-foreground mb-3">
                      This room will be password protected. Only users with the password can join.
                    </p>
                    
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-sm font-medium flex items-center gap-1.5" htmlFor="password">
                          <Lock className="h-4 w-4" />
                          Room Password
                        </label>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 px-2 text-xs"
                          onClick={handleGeneratePassword}
                        >
                          Generate
                        </Button>
                      </div>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          id="password"
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background pr-10 ${
                            error && !password ? 'border-destructive' : 'border-border'
                          }`}
                          placeholder="Enter password"
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            if (error) setError('');
                          }}
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {!isPrivate && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <p>This room will be visible to everyone and anyone can join.</p>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end gap-3">
                <Button 
                  variant="outline" 
                  type="button"
                  onClick={onClose}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Room"
                  )}
                </Button>
              </div>
            </form>
          ) : (
            <>
              <div className="bg-secondary/10 rounded-lg p-4 mb-6 border border-border/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Room Link</span>
                  <button
                    className="text-primary hover:text-primary/80 transition-colors flex items-center gap-1 text-sm"
                    onClick={copyRoomLink}
                  >
                    {isCopied ? (
                      <>
                        <Check size={14} />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="text-sm font-mono bg-background p-2 rounded border border-border overflow-x-auto">
                  {window.location.origin}/room/{roomId}
                </div>
              </div>
              
              {isPrivate && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Lock className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Room Password</span>
                  </div>
                  <div className="bg-primary/10 text-primary text-sm p-2 rounded border border-primary/20">
                    <p className="font-medium">{password}</p>
                    <p className="text-xs mt-1 text-muted-foreground">
                      Keep this password safe! Only share it with people you want to invite.
                    </p>
                  </div>
                </div>
              )}
              
              <p className="text-sm text-muted-foreground mb-6">
                Share this link{isPrivate ? " and password" : ""} with others to invite them to your room. 
                {isPrivate ? " Only those with both the link and password can join." : " Anyone with the link can join your coding session."}
              </p>
              
              <div className="flex justify-end gap-3">
                <Button 
                  variant="outline" 
                  type="button"
                  onClick={onClose}
                >
                  Close
                </Button>
                <Button onClick={joinRoom}>
                  Join Room
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateRoomModal;
