
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, EyeOff, Eye, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRoomAccess } from '@/hooks/useRoomAccess';
import { useToast } from '@/hooks/use-toast';

interface JoinRoomWithPasswordProps {
  roomId: string;
  onCancel: () => void;
  onSuccess: () => void;
}

const JoinRoomWithPassword: React.FC<JoinRoomWithPasswordProps> = ({ 
  roomId, 
  onCancel,
  onSuccess
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [navigationTriggered, setNavigationTriggered] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { joinRoom, loading: isLoading, lastJoinedRoom } = useRoomAccess({
    onSuccess: (roomId, password) => {
      toast({
        title: "Success",
        description: "Joined room successfully",
        variant: "success",
      });
      
      // Call onSuccess to notify parent component of successful join
      onSuccess();
      
      // Set flag that navigation was triggered to prevent duplicate navigations
      setNavigationTriggered(true);
      
      // Navigate with a delay to ensure proper state updates
      setTimeout(() => {
        navigate(`/room/${roomId}`, { replace: true });
      }, 1000);
    },
    onError: (message) => {
      setError(message);
    }
  });

  useEffect(() => {
    // Clean up navigation flag when component unmounts
    return () => {
      setNavigationTriggered(false);
    };
  }, []);

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password.trim()) {
      setError('Password is required');
      return;
    }

    if (!navigationTriggered) {
      joinRoom(roomId, password);
    }
  };

  return (
    <div className="py-4">
      <div className="mb-4 flex items-center gap-2 text-amber-500 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-md">
        <AlertTriangle size={18} />
        <p className="text-sm">This room is password protected</p>
      </div>

      <form onSubmit={handleJoinRoom}>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1.5 flex items-center gap-1.5" htmlFor="room-password">
            <Lock className="h-4 w-4" />
            Room Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              id="room-password"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background pr-10 ${
                error ? 'border-destructive' : 'border-border'
              }`}
              placeholder="Enter room password"
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
          {error && (
            <p className="text-xs text-destructive mt-1.5">{error}</p>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button 
            variant="outline" 
            type="button"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Joining...
              </>
            ) : (
              "Join Room"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default JoinRoomWithPassword;
