
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, LogIn, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast";

interface JoinRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const JoinRoomModal: React.FC<JoinRoomModalProps> = ({ isOpen, onClose }) => {
  const [roomId, setRoomId] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  if (!isOpen) return null;
  
  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!roomId.trim()) {
      toast({
        title: "Room ID required",
        description: "Please enter a valid room ID",
        variant: "destructive",
      });
      return;
    }
    
    setIsJoining(true);
    
    // Here you would verify if the room exists
    // For now, we just navigate to the room
    setTimeout(() => {
      navigate(`/room/${roomId}`);
      onClose();
    }, 1000);
  };
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-gradient-to-br from-background to-secondary/10 rounded-lg shadow-xl w-full max-w-md relative overflow-hidden animate-scale border border-border/50"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary to-primary/70"></div>
        
        <div className="flex justify-between items-center p-6 border-b border-border/40">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-md bg-primary/10 text-primary">
              <LogIn size={20} />
            </div>
            <h2 className="text-xl font-semibold text-foreground">Join a Room</h2>
          </div>
          <button 
            className="text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-secondary/50 p-1"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
          <form onSubmit={handleJoinRoom}>
            <div className="mb-6 space-y-2">
              <label className="block text-sm font-medium mb-1.5" htmlFor="roomId">
                Room ID
              </label>
              <Input
                id="roomId"
                className="w-full bg-background/80 border-border/60 focus:border-primary/40 transition-all"
                placeholder="Enter room ID, e.g. room_abc123"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                required
                autoComplete="off"
                autoFocus
              />
              <p className="text-xs text-muted-foreground mt-1.5 flex items-center">
                <span className="bg-secondary/30 p-1 rounded-full mr-2">
                  <ArrowRight size={10} className="text-muted-foreground" />
                </span>
                Enter the room ID shared with you by the room creator
              </p>
            </div>
            
            <div className="flex justify-end gap-3 pt-2">
              <Button 
                variant="outline" 
                type="button"
                onClick={onClose}
                className="border-border/60 hover:bg-secondary/30"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isJoining}
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white"
              >
                {isJoining ? (
                  <>
                    <span className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-background border-r-transparent"></span>
                    Joining...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Join Room
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default JoinRoomModal;
