import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageTransition from '@/components/transitions/PageTransition';
import RoomNavbar from '@/components/room/RoomNavbar';
import CodeEditor from '@/components/room/CodeEditor';
import VideoChat from '@/components/room/VideoChat';
import TextChat from '@/components/room/TextChat';
import JoinRoomWithPassword from '@/components/room/JoinRoomWithPassword';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import { buildApiUrl } from '@/api/config';
import { Code, Loader2, Lock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { io, Socket } from 'socket.io-client';

interface RoomDetails {
  id: string;
  name: string;
  language: string;
  code: string;
  isPrivate: boolean;
  password: string | null;
  owner: {
    id: string;
    username: string;
    avatar?: string;
  };
  participants: {
    user: {
      id: string;
      username: string;
      avatar?: string;
    };
    joinedAt: Date;
  }[];
  sharedWith?: {
    user: {
      id: string;
      username: string;
      avatar?: string;
    };
    sharedAt: Date;
  }[];
}

interface Message {
  _id: string;
  room: string;
  sender: {
    _id: string;
    username: string;
    avatar?: string;
  };
  content: string;
  type: 'text' | 'code' | 'system';
  createdAt: string;
}

interface ActiveUser {
  id: string;
  socketId: string;
  username: string;
  avatar?: string;
  displayName?: string;
  firstName?: string;
  isCreator?: boolean;
}

const Room: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { user, token, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [roomDetails, setRoomDetails] = useState<RoomDetails | null>(null);
  const [isLeaving, setIsLeaving] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [participantCount, setParticipantCount] = useState(0);
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [passwordCheckLoading, setPasswordCheckLoading] = useState(true);
  const [accessCheckAttempts, setAccessCheckAttempts] = useState(0);
  
  useEffect(() => {
    if (!roomId) return;
    
    if (!isAuthenticated && accessCheckAttempts < 5) {
      const timer = setTimeout(() => {
        console.log("Auth not ready, retrying room access check...", accessCheckAttempts + 1);
        setAccessCheckAttempts(prev => prev + 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
    
    if (!isAuthenticated && accessCheckAttempts >= 5) {
      console.log("Max auth check attempts reached, redirecting to login");
      toast({
        title: "Login required",
        description: "Please login to access this room",
        variant: "destructive",
      });
      navigate('/login', { state: { returnUrl: `/room/${roomId}` } });
      return;
    }
    
    if (isAuthenticated && token) {
      const checkRoomAccess = async () => {
        try {
          setPasswordCheckLoading(true);
          console.log("Checking room access for room ID:", roomId);
          
          const response = await fetch(buildApiUrl(`rooms/${roomId}`), {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          console.log("Room access check response status:", response.status);
          
          if (response.status === 403) {
            const data = await response.json();
            console.log("Room access check error:", data);
            
            if (data.passwordRequired) {
              console.log("Room requires password");
              setPasswordRequired(true);
              setPasswordCheckLoading(false);
              return;
            }
            
            toast({
              title: "Access denied",
              description: "You don't have access to this private room",
              variant: "destructive",
            });
            navigate('/rooms');
            return;
          }
          
          if (!response.ok) {
            console.error("Failed to load room:", response.status);
            toast({
              title: "Error",
              description: "Failed to load room. It may have been deleted.",
              variant: "destructive",
            });
            navigate('/rooms');
            return;
          }
          
          const roomData = await response.json();
          console.log("Room data:", roomData);
          
          if (roomData.isPrivate && roomData.password) {
            const isOwner = (roomData.owner._id === user?.id || roomData.owner._id === user?._id || 
                          roomData.owner.id === user?.id || roomData.owner.id === user?._id);
            const isSharedWith = roomData.sharedWith && roomData.sharedWith.some(s => 
              (s.user._id === user?.id || s.user._id === user?._id || 
               s.user.id === user?.id || s.user.id === user?._id)
            );
            
            console.log("Private room access check - isOwner:", isOwner, "isSharedWith:", isSharedWith);
            
            if (!isOwner && !isSharedWith) {
              setPasswordRequired(true);
              setPasswordCheckLoading(false);
              return;
            }
          }
          
          setPasswordRequired(false);
          setPasswordCheckLoading(false);
          setupSocketConnection();
          
        } catch (error) {
          console.error("Failed to check room access", error);
          setPasswordCheckLoading(false);
          toast({
            title: "Error",
            description: "Could not connect to the room",
            variant: "destructive",
          });
          
          if (accessCheckAttempts < 3) {
            const timer = setTimeout(() => {
              console.log("Network error, retrying room access check...");
              setAccessCheckAttempts(prev => prev + 1);
            }, 3000);
            return () => clearTimeout(timer);
          } else {
            navigate('/rooms');
          }
        }
      };
      
      checkRoomAccess();
    }
  }, [roomId, isAuthenticated, token, user?.id, user?._id, accessCheckAttempts]);
  
  const setupSocketConnection = () => {
    if (!roomId) return;
    
    console.log("Setting up socket connection");
    
    const socketConnection = io(import.meta.env.VITE_SOCKET_URL || 'https://chat-code-3fz6.onrender.com', {
      transports: ['websocket'],
      upgrade: false
    });
    
    setSocket(socketConnection);
    
    socketConnection.on('connect', () => {
      console.log('Socket connected:', socketConnection.id);
      
      socketConnection.emit('joinRoom', {
        roomId,
        userId: user?.id
      });
    });
    
    socketConnection.on('roomData', (data) => {
      console.log('Room data received:', data);
      setRoomDetails(data);
      setIsLoading(false);
    });
    
    socketConnection.on('activeUsers', (users) => {
      console.log('Active users received:', users);
      if (Array.isArray(users)) {
        setActiveUsers(users);
        setParticipantCount(users.length);
      }
    });
    
    socketConnection.on('userJoined', (data) => {
      console.log('User joined:', data);
      if (data && data.users && Array.isArray(data.users)) {
        setActiveUsers(data.users);
        setParticipantCount(data.users.length);
        
        if (data.user.id !== user?.id) {
          toast({
            title: "User joined",
            description: `${data.user.username} joined the room`,
          });
        }
      }
    });
    
    socketConnection.on('userLeft', (data) => {
      console.log('User left:', data);
      if (data && data.users && Array.isArray(data.users)) {
        setActiveUsers(data.users);
        setParticipantCount(data.users.length);
      }
    });
    
    socketConnection.on('participantCountUpdate', (data) => {
      console.log('Participant count update:', data);
      if (data && typeof data.count === 'number') {
        setParticipantCount(data.count);
      }
    });
    
    socketConnection.on('previousMessages', (messageData) => {
      console.log('Previous messages received:', messageData);
      if (Array.isArray(messageData)) {
        setMessages(messageData);
      }
    });
    
    socketConnection.on('newMessage', (message) => {
      console.log('New message received:', message);
      setMessages((prevMessages) => [...prevMessages, message]);
    });
    
    socketConnection.on('error', (error) => {
      console.error('Socket error:', error);
      toast({
        title: "Connection error",
        description: error.message || "Failed to connect to the room",
        variant: "destructive",
      });
      
      if (error.message && error.message.includes('access')) {
        navigate('/rooms');
      }
      
      if (error.message && error.message.includes('password')) {
        setPasswordRequired(true);
        setIsLoading(false);
      }
    });
    
    socketConnection.on('disconnect', () => {
      console.log('Socket disconnected');
    });
  };
  
  useEffect(() => {
    return () => {
      if (socket) {
        console.log('Cleaning up socket connection');
        socket.emit('leaveRoom', { roomId, userId: user?.id });
        socket.disconnect();
      }
    };
  }, [socket, roomId, user]);
  
  const handleLeaveRoom = () => {
    setIsLeaving(true);
    console.log('Leaving room:', roomId);
    
    if (socket) {
      socket.emit('leaveRoom', { roomId, userId: user?.id });
      socket.disconnect();
    }
    
    navigate('/rooms');
  };
  
  const handleSendMessage = (content: string, type: 'text' | 'code' = 'text') => {
    if (!socket || !user || !roomId) return;
    
    console.log('Sending message:', { content, type });
    socket.emit('sendMessage', {
      roomId,
      userId: user.id,
      content,
      type
    });
  };
  
  const handlePasswordSuccess = () => {
    setPasswordRequired(false);
    console.log('Password verified successfully, setting up connection');
    setupSocketConnection();
  };
  
  if (passwordCheckLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <div className="flex items-center justify-center gap-3">
          <Code size={28} className="text-primary animate-pulse" />
          <div className="text-xl font-medium">ChatCode</div>
        </div>
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <div className="text-muted-foreground">Checking room access...</div>
        </div>
      </div>
    );
  }
  
  if (passwordRequired) {
    return (
      <PageTransition>
        <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-background p-4">
          <div className="flex items-center justify-center gap-3">
            <Lock size={24} className="text-primary" />
            <div className="text-xl font-medium">Password Protected Room</div>
          </div>
          
          <div className="max-w-md w-full bg-card p-6 rounded-lg shadow-lg border border-border">
            <JoinRoomWithPassword 
              roomId={roomId || ''}
              onCancel={() => navigate('/rooms')}
              onSuccess={handlePasswordSuccess}
            />
          </div>
        </div>
      </PageTransition>
    );
  }
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <div className="flex items-center justify-center gap-3">
          <Code size={28} className="text-primary animate-pulse" />
          <div className="text-xl font-medium">ChatCode</div>
        </div>
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <div className="text-muted-foreground">Loading room...</div>
        </div>
      </div>
    );
  }
  
  return (
    <PageTransition>
      <div className="flex flex-col h-screen bg-background">
        <RoomNavbar 
          roomName={roomDetails?.name || "Unknown Room"} 
          roomId={roomId || ""} 
          participantCount={participantCount}
          onLeaveRoom={handleLeaveRoom}
          isLeaving={isLeaving}
          ownerId={roomDetails?.owner?.id}
          isPrivate={roomDetails?.isPrivate || false}
        />
        
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 overflow-hidden border-r border-border/50 bg-background">
            <CodeEditor 
              initialCode={roomDetails?.code || ""} 
              language={roomDetails?.language || "javascript"} 
              roomId={roomId || ""}
              socket={socket}
            />
          </div>
          
          <div className="w-80 h-full flex flex-col bg-secondary/5">
            <Tabs defaultValue="video" className="h-full flex flex-col">
              <div className="border-b border-border/50 px-2">
                <TabsList className="grid grid-cols-2 w-full">
                  <TabsTrigger value="video">Video</TabsTrigger>
                  <TabsTrigger value="chat">Chat</TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="video" className="flex-1 p-2 overflow-y-auto">
                <VideoChat 
                  roomId={roomId || ""} 
                  socket={socket}
                  activeUsers={activeUsers}
                />
              </TabsContent>
              
              <TabsContent value="chat" className="flex-1 overflow-hidden h-full">
                <TextChat 
                  roomId={roomId || ""} 
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  currentUser={user}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default Room;
