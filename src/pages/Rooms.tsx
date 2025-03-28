import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Users, Search, Plus, Code, Clock, Tag, Trash2, AlertCircle, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import PageTransition from '@/components/transitions/PageTransition';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CreateRoomModal from '@/components/room/CreateRoomModal';
import JoinRoomModal from '@/components/room/JoinRoomModal';
import { buildApiUrl } from '@/api/config';
import { useAuth } from '@/context/AuthContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Room {
  _id: string;
  id?: string;
  name: string;
  participants: { user: { username: string, avatar?: string, firstName?: string, displayName?: string } | null, joinedAt: Date }[];
  language: string;
  createdAt: Date;
  owner: string | {
    _id?: string;
    id?: string;
    username: string;
    avatar?: string;
  };
  isPrivate: boolean;
  password?: string;
  activeParticipantCount?: number;
}

const Rooms: React.FC = () => {
  const { isAuthenticated, user, token } = useAuth();
  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
  const [fetchAttempts, setFetchAttempts] = useState(0);

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate, isLoading]);

  useEffect(() => {
    if (!hasCheckedAuth) {
      setHasCheckedAuth(true);
      if (!isAuthenticated) {
        toast({
          title: "Login required",
          description: "You need to be logged in to view rooms",
          variant: "destructive",
        });
        navigate('/login');
      } else {
        fetchRooms();
      }
    }
  }, [isAuthenticated, hasCheckedAuth]);

  const fetchRooms = async () => {
    if (!isAuthenticated || !token) return;
    
    setIsLoading(true);
    try {
      console.log("Fetching rooms with token:", token ? "Token provided" : "No token");
      
      const response = await fetch(buildApiUrl('rooms'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          
        
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched rooms:', data);
        
        if (!Array.isArray(data) || data.length === 0) {
          console.log("No rooms found or invalid response format");
          setRooms([]);
          setIsLoading(false);
          return;
        }
        
        const roomsWithCounts = await Promise.all(data.map(async (room: Room) => {
          try {
            const participantsResponse = await fetch(buildApiUrl(`rooms/${room._id || room.id}/participants`), {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Cache-Control': 'no-cache'
              }
            });
            
            if (participantsResponse.ok) {
              const participantsData = await participantsResponse.json();
              const activeParticipants = Array.isArray(participantsData) 
                ? participantsData.filter(p => p && p.user) 
                : [];
                
              return {
                ...room,
                activeParticipantCount: activeParticipants.length
              };
            }
            return room;
          } catch (error) {
            console.error(`Failed to fetch participants for room ${room._id || room.id}:`, error);
            return room;
          }
        }));
        
        roomsWithCounts.forEach(room => {
          const roomId = room._id || room.id;
          const ownerId = typeof room.owner === 'string' ? room.owner : (room.owner?._id || room.owner?.id);
          const userId = user?.id || user?._id;
          
          console.log(`Room ${roomId} (${room.name}) - Owner: ${ownerId}, Current User: ${userId}, Is Owner: ${ownerId === userId}`);
        });
        
        setRooms(roomsWithCounts);
        setFetchAttempts(0);
      } else {
        const error = await response.json();
        toast({
          title: "Failed to fetch rooms",
          description: error.message || "Could not fetch rooms. Please try again.",
          variant: "destructive",
        });
        
        if (fetchAttempts < 3) {
          const retryDelay = Math.pow(2, fetchAttempts) * 1000;
          console.log(`Retrying fetch in ${retryDelay}ms (attempt ${fetchAttempts + 1}/3)`);
          
          setTimeout(() => {
            setFetchAttempts(prev => prev + 1);
            fetchRooms();
          }, retryDelay);
        }
      }
    } catch (error) {
      console.error("Failed to fetch rooms:", error);
      toast({
        title: "Error loading rooms",
        description: "Could not fetch the list of rooms. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      const refreshInterval = setInterval(() => {
        fetchRooms();
      }, 30000);
      
      return () => clearInterval(refreshInterval);
    }
  }, [isAuthenticated, isLoading]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isAuthenticated) {
        console.log('Tab became visible, refreshing rooms');
        fetchRooms();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    if (isAuthenticated && token) {
      fetchRooms();
    }
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated, token]);

  const isRoomCreator = (room: Room) => {
    if (!user || !room) return false;
    
    let ownerId = '';
    
    if (room.owner) {
      if (typeof room.owner === 'string') {
        ownerId = room.owner;
      } else {
        ownerId = room.owner._id || room.owner.id || '';
      }
    }
    
    if (!ownerId) return false;
    
    const userId = user.id || user._id || '';
    
    return userId.toString() === ownerId.toString();
  };

  const handleDeleteRoom = async () => {
    if (!roomToDelete || !token) {
      console.log('Cannot delete room:', { hasRoom: !!roomToDelete, hasToken: !!token });
      toast({
        title: "Error",
        description: "You must be logged in to delete a room",
        variant: "destructive",
      });
      return;
    }
    
    const canDelete = isRoomCreator(roomToDelete);
    console.log('Checking delete permission:', {
      roomId: roomToDelete._id || roomToDelete.id,
      canDelete
    });

    if (!canDelete) {
      toast({
        title: "Error",
        description: "You don't have permission to delete this room",
        variant: "destructive",
      });
      return;
    }
    
    setIsDeleting(true);
    
    const roomName = roomToDelete.name;
    const roomId = roomToDelete._id || roomToDelete.id;
    
    setRooms(prevRooms => prevRooms.filter(room => {
      const currentId = room._id || room.id;
      return currentId !== roomId;
    }));
    
    setRoomToDelete(null);
    
    try {
      console.log('Attempting to delete room:', { roomId, token: !!token });
      
      const response = await fetch(buildApiUrl(`rooms/${roomId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        toast({
          title: "Room deleted",
          description: `"${roomName}" has been successfully deleted`,
          variant: "success",
        });
        console.log('Room deleted successfully:', roomId);
      } else {
        const error = await response.json();
        console.error('Failed to delete room:', error);
        
        fetchRooms();
        
        toast({
          title: "Failed to delete room",
          description: error.message || "Could not delete the room. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting room:", error);
      
      fetchRooms();
      
      toast({
        title: "Failed to delete room",
        description: "An error occurred while deleting the room",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateRoomSuccess = (newRoom: Room) => {
    setRooms(prevRooms => [newRoom, ...prevRooms]);
    setIsCreateModalOpen(false);
    toast({
      title: "Room created!",
      description: "Your new coding room is ready.",
      variant: "success",
    });
  };

  const filteredRooms = rooms.filter((room) =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.language.toLowerCase().includes(searchQuery.toLowerCase())
  );

  function formatTime(date: Date) {
    const now = new Date();
    const diffMs = now.getTime() - (date instanceof Date ? date.getTime() : new Date(date).getTime());
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) {
      return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    } else {
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) {
        return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
      } else {
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
      }
    }
  }

  const getUserDisplayName = (participant: any) => {
    if (!participant || !participant.user) return '';
    
    if (participant.user.firstName) {
      return participant.user.firstName;
    }
    if (participant.user.displayName) {
      return participant.user.displayName.split(' ')[0];
    }
    return participant.user.username || '';
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <PageTransition>
      <Navbar />
      
      <main className="container mx-auto px-4 py-16 min-h-screen">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-bold">Coding Rooms</h1>
              <p className="text-muted-foreground">
                Browse active coding rooms or create your own session
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <div className="relative w-full sm:max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search rooms by name or language..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={() => setIsJoinModalOpen(true)}
                  variant="outline"
                >
                  Join Room
                </Button>
                <Button 
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Room
                </Button>
              </div>
            </div>
            
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="overflow-hidden animate-pulse">
                    <CardHeader className="pb-2">
                      <div className="h-5 bg-muted rounded w-3/4"></div>
                      <div className="h-4 bg-muted rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="h-4 bg-muted rounded w-1/3"></div>
                    </CardContent>
                    <CardFooter>
                      <div className="h-10 bg-muted rounded w-full"></div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : filteredRooms.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRooms.map((room) => {
                  const isCreator = isRoomCreator(room);
                  
                  return (
                    <Card 
                      key={room._id || room.id} 
                      className="overflow-hidden hover:shadow-md transition-all hover:-translate-y-1 border-border/50 group bg-gradient-to-br from-card to-secondary/30 relative"
                    >
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start gap-2">
                          <CardTitle className="text-lg flex items-center gap-2 flex-1">
                            <span className="truncate">{room.name}</span>
                            {room.isPrivate && (
                              <Lock size={16} className="text-amber-500" aria-label="Private Room" />
                            )}
                          </CardTitle>
                          <div className="flex items-center gap-2 shrink-0">
                            {isCreator && (
                              <>
                                <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full whitespace-nowrap">
                                  Creator
                                </span>
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  className="h-7 w-7 rounded-full bg-red-500/90 hover:bg-red-600 text-white shadow-md"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    setRoomToDelete(room);
                                  }}
                                  aria-label="Delete this room"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                        <CardDescription className="flex items-center gap-2">
                          <Tag className="h-3.5 w-3.5" />
                          <span className="capitalize">{room.language}</span>
                          <span className="mx-1">•</span>
                          <Clock className="h-3.5 w-3.5" />
                          <span>{formatTime(room.createdAt)}</span>
                        </CardDescription>
                      </CardHeader>
                      
                      <CardContent className="pb-2">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Users className="mr-1 h-4 w-4" />
                          <span>{room.activeParticipantCount || 0} active participant{(room.activeParticipantCount || 0) !== 1 && 's'}</span>
                        </div>
                        
                        {room.participants && room.participants.length > 0 && (
                          <div className="mt-2 flex -space-x-2 overflow-hidden">
                            {room.participants.slice(0, 3).map((participant, i) => {
                              if (!participant || !participant.user) {
                                return null;
                              }
                              
                              const hasAvatar = participant.user && participant.user.avatar;
                              const displayName = getUserDisplayName(participant);
                              
                              if (!displayName) {
                                return null;
                              }
                              
                              return (
                                <div 
                                  key={i} 
                                  className="inline-block h-6 w-6 rounded-full ring-2 ring-background"
                                  title={displayName}
                                >
                                  {hasAvatar ? (
                                    <img 
                                      src={participant.user.avatar} 
                                      alt={displayName}
                                      className="h-full w-full rounded-full object-cover"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.onerror = null;
                                        target.src = `https://ui-avatars.com/api/?name=${displayName}&background=random`;
                                      }}
                                    />
                                  ) : (
                                    <div className="h-full w-full rounded-full bg-primary/20 flex items-center justify-center text-xs text-primary-foreground">
                                      {displayName.charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                            {room.participants.length > 3 && (
                              <div className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-xs text-secondary-foreground ring-2 ring-background">
                                +{room.participants.length - 3}
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                      
                      <CardFooter className="flex justify-center">
                        <Button 
                          asChild 
                          className="w-full bg-gradient-to-r from-secondary/90 to-secondary/70 hover:from-primary/90 hover:to-primary/70 text-secondary-foreground hover:text-primary-foreground transition-all duration-300"
                        >
                          <Link to={`/room/${room._id || room.id}`} className="flex items-center justify-center">
                            <Code className="mr-2 h-4 w-4" />
                            Join Session
                          </Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center bg-secondary/10 rounded-lg border border-border/50">
                <div className="mb-4 rounded-full bg-secondary p-3">
                  <Search className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium">No rooms found</h3>
                <p className="text-muted-foreground mt-1 max-w-md">
                  {searchQuery 
                    ? `No rooms match your search for "${searchQuery}"`
                    : "There are no active coding rooms available right now"
                  }
                </p>
                <Button 
                  className="mt-4 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white" 
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  Create a Room
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
      
      <CreateRoomModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateRoomSuccess}
      />

      <JoinRoomModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
      />

      <AlertDialog open={!!roomToDelete} onOpenChange={(open) => !open && setRoomToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Confirm Room Deletion
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{roomToDelete?.name}"? This action cannot be undone, and all associated data will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRoom}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <span className="flex items-center">
                  <span className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-background border-r-transparent"></span>
                  Deleting...
                </span>
              ) : (
                "Delete Room"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageTransition>
  );
};

export default Rooms;
