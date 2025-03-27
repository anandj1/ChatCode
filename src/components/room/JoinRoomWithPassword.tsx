import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, EyeOff, Eye, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { buildApiUrl } from '@/api/config';
import { useAuth } from '@/context/AuthContext';
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { token } = useAuth();
  const { toast } = useToast();

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!password.trim()) {
      setError('Password is required');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(buildApiUrl(`rooms/${roomId}/join`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password })
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: "Joined room successfully",
          variant: "success",
        });
        // First call onSuccess to update parent component state
        onSuccess();
        // Then set a small timeout before navigation to ensure state is updated
        setTimeout(() => {
          window.location.reload(); // Force reload to ensure fresh socket connection
        }, 100);
      } else {
        setError(data.message || 'Failed to join room. Please check your password.');
      }
    } catch (error) {
      setError('Connection error. Please try again.');
      toast({
        title: "Error",
        description: "Failed to join room. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
          <label className="block text-sm font-medium mb-1.5 items-center gap-1.5" htmlFor="room-password">
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