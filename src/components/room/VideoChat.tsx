import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Mic, MicOff, Camera, CameraOff, PhoneOff, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { Socket } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';

interface VideoChatProps {
  roomId: string;
  socket: Socket | null;
  activeUsers: any[];
}

const VideoChat: React.FC<VideoChatProps> = ({ roomId, socket, activeUsers }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [peerConnections, setPeerConnections] = useState<Map<string, RTCPeerConnection>>(new Map());
  const [isMicActive, setIsMicActive] = useState(true);
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [showParticipants, setShowParticipants] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRefs = useRef<Map<string, HTMLVideoElement | null>>(new Map());
  
  // Get user media for video/audio
  useEffect(() => {
    const getMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        
        setLocalStream(stream);
        setIsLoading(false);
        
        if (socket) {
          socket.emit('streamReady', {
            roomId,
            userId: user?.id
          });
        }
        
      } catch (error) {
        console.error("Error accessing media devices:", error);
        setIsLoading(false);
        setIsCameraActive(false);
        setIsMicActive(false);
        
        useToast().toast({
          title: "Camera/microphone access denied",
          description: "Please allow access to your camera and microphone to use video chat.",
          variant: "destructive",
        });
      }
    };
    
    if (roomId) {
      getMedia();
    }
    
    // Cleanup
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      // Close all peer connections
      peerConnections.forEach(connection => {
        connection.close();
      });
    };
  }, [roomId]);
  
  // Setup WebRTC peer connections when users join
  useEffect(() => {
    if (!socket || !localStream || !user) return;
    
    // Handle when a new user joins
    socket.on('userJoined', async (data) => {
      if (data.user.id !== user.id) {
        // Create a new peer connection for the joined user
        createPeerConnection(data.user.id);
      }
    });
    
    // Handle when a user makes an offer
    socket.on('offer', async (data) => {
      if (data.target === user.id) {
        const pc = peerConnections.get(data.sender) || createPeerConnection(data.sender);
        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        
        socket.emit('answer', {
          sender: user.id,
          target: data.sender,
          sdp: pc.localDescription,
          roomId
        });
      }
    });
    
    // Handle when receiving an answer to our offer
    socket.on('answer', async (data) => {
      if (data.target === user.id) {
        const pc = peerConnections.get(data.sender);
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
        }
      }
    });
    
    // Handle ICE candidates
    socket.on('iceCandidate', async (data) => {
      if (data.target === user.id) {
        const pc = peerConnections.get(data.sender);
        if (pc) {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
      }
    });
    
    // Handle user leaving
    socket.on('userLeft', (data) => {
      const userId = data.user?.id;
      if (userId) {
        const pc = peerConnections.get(userId);
        if (pc) {
          pc.close();
          const newPeerConnections = new Map(peerConnections);
          newPeerConnections.delete(userId);
          setPeerConnections(newPeerConnections);
          
          const newRemoteStreams = new Map(remoteStreams);
          newRemoteStreams.delete(userId);
          setRemoteStreams(newRemoteStreams);
        }
      }
    });
    
    // When we join, create peer connections with all existing users
    activeUsers.forEach(activeUser => {
      if (activeUser.id !== user.id) {
        createPeerConnection(activeUser.id);
      }
    });
    
    return () => {
      socket.off('userJoined');
      socket.off('offer');
      socket.off('answer');
      socket.off('iceCandidate');
      socket.off('userLeft');
    };
  }, [socket, localStream, activeUsers, user]);
  
  // Function to create a peer connection for a specific user
  const createPeerConnection = (userId: string) => {
    if (peerConnections.has(userId)) {
      return peerConnections.get(userId)!;
    }
    
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });
    
    // Add our local stream to the connection
    if (localStream) {
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });
    }
    
    // Listen for remote stream
    pc.ontrack = (event) => {
      const stream = event.streams[0];
      setRemoteStreams(prev => {
        const newMap = new Map(prev);
        newMap.set(userId, stream);
        return newMap;
      });
    };
    
    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socket && user) {
        socket.emit('iceCandidate', {
          sender: user.id,
          target: userId,
          candidate: event.candidate,
          roomId
        });
      }
    };
    
    // Create an offer if we're the one connecting
    if (user && user.id < userId) {
      pc.createOffer()
        .then(offer => pc.setLocalDescription(offer))
        .then(() => {
          if (socket && pc.localDescription && user) {
            socket.emit('offer', {
              sender: user.id,
              target: userId,
              sdp: pc.localDescription,
              roomId
            });
          }
        })
        .catch(err => console.error('Error creating offer:', err));
    }
    
    // Store the peer connection
    setPeerConnections(prev => {
      const newMap = new Map(prev);
      newMap.set(userId, pc);
      return newMap;
    });
    
    return pc;
  };
  
  // Update local video element with stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);
  
  // Toggle mic/camera based on state
  useEffect(() => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      if (videoTracks.length > 0) {
        videoTracks[0].enabled = isCameraActive;
      }
      
      const audioTracks = localStream.getAudioTracks();
      if (audioTracks.length > 0) {
        audioTracks[0].enabled = isMicActive;
      }
    }
  }, [isCameraActive, isMicActive, localStream]);
  
  const toggleMic = () => {
    setIsMicActive(!isMicActive);
    
    if (socket) {
      socket.emit('toggleAudio', {
        roomId,
        userId: user?.id,
        enabled: !isMicActive
      });
    }
  };
  
  const toggleCamera = () => {
    setIsCameraActive(!isCameraActive);
    
    if (socket) {
      socket.emit('toggleVideo', {
        roomId,
        userId: user?.id,
        enabled: !isCameraActive
      });
    }
  };
  
  const leaveCall = () => {
    // First stop all tracks
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    
    // Close all peer connections
    peerConnections.forEach(connection => {
      connection.close();
    });
    
    setPeerConnections(new Map());
    setRemoteStreams(new Map());
    
    // If socket is active, emit leave room event
    if (socket) {
      socket.emit('leaveRoom', { roomId, userId: user?.id });
      socket.disconnect();
    }
    
    // Navigate back to rooms page
    navigate('/rooms');
  };
  
  // Get a list of participants excluding the current user
  const participants = activeUsers
    .filter(participant => participant.id !== user?.id);

  // Get first name from username
  const getFirstName = (username: string) => {
    return username ? username.split(' ')[0] : '?';
  };
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto space-y-3 p-1">
        {/* Local video (you) */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="relative aspect-video bg-gray-800/80 rounded-md overflow-hidden shadow-md"
        >
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className={`w-full h-full object-cover ${!isCameraActive ? 'hidden' : ''}`}
              ></video>
              {!isCameraActive && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-primary/20 backdrop-blur-sm flex items-center justify-center">
                    <span className="text-lg font-semibold">
                      {user?.username?.charAt(0) || 'Y'}
                    </span>
                  </div>
                </div>
              )}
              <div className="absolute bottom-2 left-2 text-white text-xs font-medium bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full">
                You {!isMicActive && '(muted)'}
              </div>
            </>
          )}
        </motion.div>
        
        {/* Remote participants */}
        {Array.from(remoteStreams).map(([userId, stream]) => {
          const participant = participants.find(p => p.id === userId);
          const firstName = participant?.username ? getFirstName(participant.username) : 'User';
          
          return (
            <motion.div 
              key={userId} 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="relative aspect-video bg-gray-800/80 rounded-md overflow-hidden shadow-md"
            >
              <video
                ref={el => {
                  if (el) {
                    el.srcObject = stream;
                    remoteVideoRefs.current.set(userId, el);
                  }
                }}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              ></video>
              <div className="absolute bottom-2 left-2 text-white text-xs font-medium bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full">
                {firstName}
              </div>
            </motion.div>
          );
        })}
        
        {participants.length > 0 && Array.from(remoteStreams).length === 0 ? (
          participants.map((participant) => {
            const firstName = participant?.username ? getFirstName(participant.username) : 'User';
            
            return (
              <motion.div 
                key={participant.id} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="relative aspect-video bg-gray-800/80 rounded-md overflow-hidden shadow-md"
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-primary/20 backdrop-blur-sm flex items-center justify-center">
                    <span className="text-lg font-semibold">
                      {participant.username?.charAt(0) || '?'}
                    </span>
                  </div>
                </div>
                <div className="absolute bottom-2 left-2 text-white text-xs font-medium bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full">
                  {firstName}
                </div>
              </motion.div>
            );
          })
        ) : participants.length === 0 && (
          <div className="p-4 text-center text-muted-foreground bg-secondary/10 rounded-md border border-secondary/20 backdrop-blur-sm">
            No other participants in the call yet.
          </div>
        )}
      </div>
      
      {/* Controls */}
      <div className="mt-4 flex justify-center space-x-3 p-3 bg-secondary/10 rounded-lg border border-secondary/20 backdrop-blur-sm">
        <Button
          size="icon"
          variant={isMicActive ? "default" : "destructive"}
          onClick={toggleMic}
          className={`rounded-full h-12 w-12 shadow-md transition-transform ${isMicActive ? 'hover:bg-primary/80' : 'hover:bg-destructive/80'} hover:scale-110`}
          disabled={isLoading}
        >
          {isMicActive ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
        </Button>
        
        <Button
          size="icon"
          variant={isCameraActive ? "default" : "destructive"}
          onClick={toggleCamera}
          className={`rounded-full h-12 w-12 shadow-md transition-transform ${isCameraActive ? 'hover:bg-primary/80' : 'hover:bg-destructive/80'} hover:scale-110`}
          disabled={isLoading}
        >
          {isCameraActive ? <Camera className="h-5 w-5" /> : <CameraOff className="h-5 w-5" />}
        </Button>
        
        <Button
          size="icon"
          variant="destructive"
          onClick={leaveCall}
          className="rounded-full h-12 w-12 shadow-md transition-transform hover:bg-red-700 hover:scale-110"
          disabled={isLoading}
        >
          <PhoneOff className="h-5 w-5" />
        </Button>
        
        {/* Updated participants button with properly positioned badge */}
        <div className="relative">
          <Button
            size="icon"
            variant="outline"
            className="rounded-full h-12 w-12 shadow-md transition-transform hover:bg-secondary hover:scale-110"
            disabled={isLoading}
            onClick={() => setShowParticipants(true)}
          >
            <Users className="h-5 w-5" />
          </Button>
          <Badge 
            variant="default" 
            className="absolute -top-2 -right-2 min-w-5 h-5 flex items-center justify-center text-xs rounded-full"
          >
            {participants.length + 1}
          </Badge>
        </div>
      </div>
      
      <div className="mt-2 text-xs text-center text-muted-foreground">
        Room ID: {roomId.substring(0, 12)}...
      </div>
      
      {/* Participants dialog */}
      <Dialog open={showParticipants} onOpenChange={setShowParticipants}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Participants ({participants.length + 1})</DialogTitle>
          </DialogHeader>
          <div className="max-h-60 overflow-y-auto">
            <div className="py-2 px-4 border-b">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-primary/15 backdrop-blur-sm flex items-center justify-center">
                  <span className="text-sm font-semibold">
                    {user?.username?.charAt(0) || 'Y'}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {user?.username ? getFirstName(user.username) : 'You'} (You)
                  </p>
                </div>
                {!isMicActive && <MicOff className="h-4 w-4 text-muted-foreground" />}
              </div>
            </div>
            {participants.map((participant) => {
              const firstName = participant?.username ? getFirstName(participant.username) : 'User';
              
              return (
                <div key={participant.id} className="py-2 px-4 border-b">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-primary/15 backdrop-blur-sm flex items-center justify-center">
                      <span className="text-sm font-semibold">
                        {participant.username?.charAt(0) || '?'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{firstName}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VideoChat;
