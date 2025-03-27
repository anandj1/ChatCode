import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Share2, Code, Users, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/context/AuthContext';
import { Badge } from '@/components/ui/badge';
import ShareRoomDialog from './ShareRoomDialog';
import { buildApiUrl } from '@/api/config';

interface RoomNavbarProps {
  roomName: string;
  roomId: string;
  participantCount: number;
  onLeaveRoom: () => void;
  isLeaving?: boolean;
  ownerId?: string;
  isPrivate?: boolean;
}

const RoomNavbar: React.FC<RoomNavbarProps> = ({
  roomName,
  roomId,
  participantCount,
  onLeaveRoom,
  isLeaving = false,
  ownerId,
  isPrivate = false
}) => {
  const { user, token } = useAuth();
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [roomPassword, setRoomPassword] = useState<string | null>(null);
  
  const isRoomOwner = ownerId && user?.id === ownerId;
  
  // Fetch room details to get password when sharing (only for owner)
  const fetchRoomDetails = async () => {
    if (!isRoomOwner || !token) return;
    
    try {
      console.log("Fetching room details for sharing");
      const response = await fetch(buildApiUrl(`rooms/${roomId}`), {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log("Room details fetched:", data);
        if (data.isPrivate && data.password) {
          setRoomPassword(data.password);
        }
      }
    } catch (error) {
      console.error('Error fetching room details:', error);
    }
  };
  
  const handleShareClick = () => {
    fetchRoomDetails(); // Fetch room details to get password
    setIsShareDialogOpen(true);
  };
  
  return (
    <header className="bg-background border-b border-border/50 shadow-sm">
      <div className="container flex h-16 items-center px-4 md:px-6">
        <div className="flex items-center gap-4 mr-auto">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full"
            onClick={onLeaveRoom}
            disabled={isLeaving}
          >
            {isLeaving ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-r-transparent"></span>
            ) : (
              <ArrowLeft className="h-4 w-4" />
            )}
          </Button>
          
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8 border border-border">
              <AvatarImage src="/placeholder.svg" alt={roomName} />
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {roomName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex flex-col">
              <h1 className="text-base font-semibold tracking-tight">
                {roomName}
              </h1>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Code className="h-3 w-3" />
                <span className="truncate">Room ID: {roomId.substring(0, 10)}...</span>
                {isPrivate && (
                  <Badge variant="secondary" className="text-xs h-4 px-1.5 ml-1">Private</Badge>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 h-9"
            onClick={handleShareClick}
          >
            <Share2 className="h-4 w-4" />
            <span className="hidden sm:inline">Share</span>
          </Button>
          
          <Button
            variant="destructive"
            size="sm"
            className="gap-1.5 h-9"
            onClick={onLeaveRoom}
            disabled={isLeaving}
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Leave</span>
          </Button>
          
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-secondary/10 rounded-full border border-border/50">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm font-medium">{participantCount}</span>
          </div>
          
          {user && (
            <Avatar className="h-8 w-8 border border-border">
              <AvatarImage src={user.avatar || '/placeholder.svg'} alt={user.username} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      </div>
      
      <ShareRoomDialog
        open={isShareDialogOpen}
        onOpenChange={setIsShareDialogOpen}
        roomId={roomId}
        roomName={roomName}
        isPrivate={isPrivate}
        password={roomPassword}
      />
    </header>
  );
};

export default RoomNavbar;