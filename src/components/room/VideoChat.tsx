import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Mic, MicOff, Camera, CameraOff, PhoneOff, Users, Video, VideoOff, RefreshCw } from 'lucide-react';
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

// Optimized ICE servers for India-to-India and India-to-US connections
const iceServers = [
  // Google STUN servers (globally distributed)
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  
  // India and Asia regional STUN servers
  { urls: 'stun:stun.sipgate.net' }, // Good connectivity to Asia
  { urls: 'stun:stun.voxgratia.org' },
  { urls: 'stun:stun.services.mozilla.com' },
  { urls: 'stun:stun.qq.com' }, // China/Asia region
  
  // Public STUN servers with good connectivity in Asia
  { urls: 'stun:stun.stunprotocol.org:3478' },
  { urls: 'stun:stun.counterpath.com:3478' },
  
  // TURN servers essential for NAT traversal (multiple options for reliability)
  { 
    urls: 'turn:openrelay.metered.ca:443?transport=tcp', 
    username: 'openrelayproject', 
    credential: 'openrelayproject'
  },
  { 
    urls: 'turn:turn.anyfirewall.com:443?transport=tcp',
    username: 'webrtc',
    credential: 'webrtc'
  },
  {
    urls: 'turn:relay.metered.ca:443?transport=tcp',
    username: 'ba6a513cc3f4d431a554',
    credential: 'y+r3nHXLyGGg4Kyk'
  },
  // Singapore region TURN server for Asia/India connections
  {
    urls: 'turn:singapore.relay.metered.ca:443?transport=tcp',
    username: 'ba6a513cc3f4d431a554',
    credential: 'y+r3nHXLyGGg4Kyk'
  },
  // India-specific TURN servers
  {
    urls: 'turn:mumbai.relay.metered.ca:443?transport=tcp',
    username: 'ba6a513cc3f4d431a554',
    credential: 'y+r3nHXLyGGg4Kyk'
  },
  {
    urls: 'turn:mumbai.relay.metered.ca:80',
    username: 'ba6a513cc3f4d431a554',
    credential: 'y+r3nHXLyGGg4Kyk'
  }
];

// Key connection constants
const CONNECTION_TIMEOUT = 1500; // Reduced from 3000ms to 1500ms for faster connection retries
const RETRY_INTERVAL = 50; // Faster retry interval (was 100ms)
const ICE_GATHERING_TIMEOUT = 1000; // 1 second timeout for ICE gathering
const MEDIA_CONSTRAINTS = {
  video: {
    width: { ideal: 120, max: 160 }, // Ultra-low resolution for initial connection
    height: { ideal: 90, max: 120 },
    facingMode: "user",
    frameRate: { ideal: 6, max: 10 } // Lower framerate for better performance
  },
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    sampleRate: 11025, // Even lower sample rate (was 16000)
    channelCount: 1 // Mono audio
  }
};

// WebRTC caching for faster reconnection
const peerConnectionCache = new Map();
const sdpCache = new Map();

const VideoChat: React.FC<VideoChatProps> = ({ roomId, socket, activeUsers }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [peerConnections, setPeerConnections] = useState<Map<string, RTCPeerConnection>>(new Map());
  const [isMicActive, setIsMicActive] = useState(true);
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [showParticipants, setShowParticipants] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<Map<string, string>>(new Map());
  const [iceCandidatesBuffer, setIceCandidatesBuffer] = useState<Map<string, RTCIceCandidate[]>>(new Map());
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRefs = useRef<Map<string, HTMLVideoElement | null>>(new Map());
  const connectionTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const audioGainNodes = useRef<Map<string, GainNode>>(new Map());
  const audioContexts = useRef<Map<string, AudioContext>>(new Map());
  const connectionAttempts = useRef<Map<string, number>>(new Map());
  const lastIceCandidateTime = useRef<Map<string, number>>(new Map());
  
  // Clear timeouts on unmount
  useEffect(() => {
    return () => {
      connectionTimeouts.current.forEach((timeout) => {
        clearTimeout(timeout);
      });
      
      // Close all audio contexts
      audioContexts.current.forEach((context) => {
        try {
          context.close();
        } catch (e) {
          console.warn('Error closing audio context:', e);
        }
      });
    };
  }, []);
  
  // Initialize cached connection data when room changes
  useEffect(() => {
    // Clear existing caches when room changes
    peerConnectionCache.clear();
    sdpCache.clear();
    
    // Prefetch STUN/TURN servers for faster connection
    if (window.RTCPeerConnection) {
      try {
        const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
        pc.createDataChannel('prefetch');
        
        pc.createOffer()
          .then(offer => pc.setLocalDescription(offer))
          .catch(e => console.warn('Prefetch error:', e))
          .finally(() => {
            setTimeout(() => {
              pc.close();
            }, 500);
          });
      } catch (e) {
        console.warn('Error prefetching ICE servers:', e);
      }
    }
  }, [roomId]);
  
  useEffect(() => {
    const getMedia = async () => {
      try {
        console.log('Requesting ultra-low resolution media for fast connection');
        
        // Use extremely low resolution initially for instant connection
        const stream = await navigator.mediaDevices.getUserMedia(MEDIA_CONSTRAINTS);
        
        console.log(`Stream obtained with ${stream.getTracks().length} tracks:`, 
          stream.getTracks().map(t => `${t.kind}: ${t.label} (${t.enabled ? 'enabled' : 'disabled'})`).join(', '));
        
        // Add aggressive constraints for rapid connection
        stream.getVideoTracks().forEach(track => {
          if (track.getConstraints) {
            try {
              track.applyConstraints({
                width: { ideal: 120, max: 160 },
                height: { ideal: 90, max: 120 },
                frameRate: { ideal: 6, max: 10 }
              });
            } catch (e) {
              console.warn('Could not apply video constraints:', e);
            }
          }
        });
        
        setLocalStream(stream);
        setIsLoading(false);
        
        if (socket && socket.connected) {
          console.log('Emitting streamReady event for room', roomId);
          socket.emit('streamReady', {
            roomId,
            userId: user?.id || user?._id
          });
          
          // Immediate reconnection attempt for faster establishment
          setTimeout(() => {
            retryConnections();
          }, 20); // Ultra-fast timeout
        }
        
      } catch (error) {
        console.error("Error accessing media devices:", error);
        
        // Try audio-only immediately if video fails
        try {
          console.log('Trying audio-only as fallback');
          const audioOnlyStream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
              sampleRate: 11025,
              channelCount: 1
            },
            video: false
          });
          
          setLocalStream(audioOnlyStream);
          setIsCameraActive(false);
          setIsLoading(false);
          
          toast({
            title: "Audio-only mode",
            description: "Using audio only for faster connection.",
            variant: "warning",
          });
          
          if (socket) {
            socket.emit('streamReady', {
              roomId,
              userId: user?.id || user?._id
            });
            
            setTimeout(() => {
              retryConnections();
            }, 20);
          }
        } catch (audioError) {
          console.error("Error accessing audio devices:", audioError);
          setIsLoading(false);
          
          toast({
            title: "Media access failed",
            description: "Could not access microphone. Check permissions.",
            variant: "destructive",
          });
        }
      }
    };
    
    if (roomId && socket) {
      getMedia();
    }
    
    return () => {
      if (localStream) {
        console.log('Stopping all local media tracks');
        localStream.getTracks().forEach(track => {
          console.log(`Stopping track: ${track.kind}`);
          track.stop();
        });
      }
      
      // Close all peer connections
      peerConnections.forEach((connection, userId) => {
        console.log(`Closing peer connection with ${userId}`);
        connection.close();
      });
      
      setPeerConnections(new Map());
      setRemoteStreams(new Map());
    };
  }, [roomId, socket, user?.id, user?._id]);
  
  // Socket event handlers and peer connection setup
  useEffect(() => {
    if (!socket || !localStream || !user) return;
    
    const userId = user.id || user._id;
    if (!userId) return;
    
    console.log('Setting up WebRTC connections with active users:', activeUsers);
    
    // Create immediate connections to all users
    activeUsers.forEach(activeUser => {
      if (activeUser.id !== userId && activeUser.id !== socket.id) {
        console.log(`Creating peer connection with user ${activeUser.id}`);
        createPeerConnection(activeUser.id);
      }
    });
    
    const handleUserJoined = async (data: any) => {
      console.log('User joined event received:', data);
      if (data.user && data.user.id !== userId && data.user.id !== socket.id) {
        console.log(`New user joined: ${data.user.id}, creating peer connection`);
        createPeerConnection(data.user.id);
      }
    };
    
    const handleOffer = async (data: any) => {
      if (data.target === socket.id) {
        console.log(`Got offer from ${data.sender}, creating answer`);
        
        const pc = peerConnections.get(data.sender) || createPeerConnection(data.sender);
        
        try {
          // Cache the SDP for faster reconnection
          sdpCache.set(`offer-${data.sender}`, data.sdp);
          
          await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
          console.log('Remote description set successfully from offer');
          
          // Apply any buffered ICE candidates immediately
          const bufferedCandidates = iceCandidatesBuffer.get(data.sender) || [];
          console.log(`Applying ${bufferedCandidates.length} buffered ICE candidates for ${data.sender}`);
          
          for (const candidate of bufferedCandidates) {
            try {
              await pc.addIceCandidate(candidate);
            } catch (err) {
              console.error('Error applying buffered ICE candidate:', err);
            }
          }
          
          const answer = await pc.createAnswer({
            iceRestart: true
          });
          
          // Cache the SDP for faster reconnection
          sdpCache.set(`answer-${data.sender}`, answer);
          
          await pc.setLocalDescription(answer);
          
          // Send answer immediately
          socket.emit('answer', {
            sender: socket.id,
            target: data.sender,
            sdp: pc.localDescription,
            roomId
          });
          
          setConnectionStatus(prev => {
            const newStatus = new Map(prev);
            newStatus.set(data.sender, 'connecting');
            return newStatus;
          });
        } catch (error) {
          console.error('Error creating answer:', error);
          
          // Rapid retry on error
          setTimeout(() => {
            socket.emit('retryConnection', {
              targetId: data.sender,
              roomId
            });
          }, 50);
        }
      }
    };
    
    const handleAnswer = async (data: any) => {
      if (data.target === socket.id) {
        const pc = peerConnections.get(data.sender);
        if (pc) {
          try {
            // Cache the SDP for faster reconnection
            sdpCache.set(`answer-${data.sender}`, data.sdp);
            
            await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
            
            // Apply any buffered ICE candidates immediately
            const bufferedCandidates = iceCandidatesBuffer.get(data.sender) || [];
            
            for (const candidate of bufferedCandidates) {
              try {
                await pc.addIceCandidate(candidate);
              } catch (err) {
                console.error('Error applying buffered ICE candidate after answer:', err);
              }
            }
            
            const newBuffer = new Map(iceCandidatesBuffer);
            newBuffer.delete(data.sender);
            setIceCandidatesBuffer(newBuffer);
            
            setConnectionStatus(prev => {
              const newStatus = new Map(prev);
              newStatus.set(data.sender, 'connected');
              return newStatus;
            });
          } catch (error) {
            console.error('Error setting remote description from answer:', error);
            
            // Rapid retry on error
            setTimeout(() => {
              socket.emit('retryConnection', {
                targetId: data.sender,
                roomId
              });
            }, 50);
          }
        }
      }
    };
    
    const handleIceCandidate = async (data: any) => {
      if (data.target === socket.id) {
        const pc = peerConnections.get(data.sender);
        
        if (pc) {
          const iceCandidate = new RTCIceCandidate(data.candidate);
          
          // Update last ICE candidate time for this connection
          lastIceCandidateTime.current.set(data.sender, Date.now());
          
          if (pc.remoteDescription && pc.remoteDescription.type) {
            try {
              await pc.addIceCandidate(iceCandidate);
            } catch (error) {
              console.error('Error adding ICE candidate:', error);
            }
          } else {
            const newBuffer = new Map(iceCandidatesBuffer);
            const currentBuffer = newBuffer.get(data.sender) || [];
            currentBuffer.push(iceCandidate);
            newBuffer.set(data.sender, currentBuffer);
            setIceCandidatesBuffer(newBuffer);
          }
        } else {
          // Buffer ICE candidates for future use
          const newBuffer = new Map(iceCandidatesBuffer);
          const iceCandidate = new RTCIceCandidate(data.candidate);
          const currentBuffer = newBuffer.get(data.sender) || [];
          currentBuffer.push(iceCandidate);
          newBuffer.set(data.sender, currentBuffer);
          setIceCandidatesBuffer(newBuffer);
          
          // Create peer connection if it doesn't exist yet
          createPeerConnection(data.sender);
        }
      }
    };
    
    const handleUserLeft = (data: any) => {
      console.log('User left event received:', data);
      const remoteUserId = data.user?.id;
      if (remoteUserId) {
        const pc = peerConnections.get(remoteUserId);
        if (pc) {
          pc.close();
          
          const newPeerConnections = new Map(peerConnections);
          newPeerConnections.delete(remoteUserId);
          setPeerConnections(newPeerConnections);
          
          const newRemoteStreams = new Map(remoteStreams);
          newRemoteStreams.delete(remoteUserId);
          setRemoteStreams(newRemoteStreams);
          
          const newConnectionStatus = new Map(connectionStatus);
          newConnectionStatus.delete(remoteUserId);
          setConnectionStatus(newConnectionStatus);
          
          const newBuffer = new Map(iceCandidatesBuffer);
          newBuffer.delete(remoteUserId);
          setIceCandidatesBuffer(newBuffer);
          
          // Clear associated timeouts and audio nodes
          if (connectionTimeouts.current.has(remoteUserId)) {
            clearTimeout(connectionTimeouts.current.get(remoteUserId)!);
            connectionTimeouts.current.delete(remoteUserId);
          }
          
          if (audioGainNodes.current.has(remoteUserId)) {
            audioGainNodes.current.delete(remoteUserId);
          }
          
          if (audioContexts.current.has(remoteUserId)) {
            try {
              audioContexts.current.get(remoteUserId)?.close();
            } catch (e) {
              console.warn('Error closing audio context:', e);
            }
            audioContexts.current.delete(remoteUserId);
          }
        }
      }
    };
    
    const handleStreamReady = (data: any) => {
      if (data.userId !== userId) {
        setTimeout(() => {
          const pc = peerConnections.get(data.userId);
          if (pc) {
            console.log(`Peer ${data.userId} is ready with media, renegotiating`);
            pc.createOffer({
              offerToReceiveAudio: true,
              offerToReceiveVideo: true,
              iceRestart: true
            })
              .then(offer => pc.setLocalDescription(offer))
              .then(() => {
                if (socket && pc.localDescription) {
                  socket.emit('offer', {
                    sender: socket.id,
                    target: data.userId,
                    sdp: pc.localDescription,
                    roomId
                  });
                }
              })
              .catch(err => console.error('Error creating renegotiation offer:', err));
          } else {
            createPeerConnection(data.userId);
          }
        }, 20); // Ultra-fast timeout
      }
    };
    
    const handleConnectionRetry = (data: any) => {
      console.log(`Connection retry requested from ${data.sender}`);
      const existingPC = peerConnections.get(data.sender);
      if (existingPC) {
        existingPC.close();
        const newPCs = new Map(peerConnections);
        newPCs.delete(data.sender);
        setPeerConnections(newPCs);
      }
      
      setTimeout(() => createPeerConnection(data.sender), 20); // Ultra-fast timeout
    };
    
    const handleReconnectPeers = (data: any) => {
      if (data.fromSocketId !== socket.id) {
        console.log(`Reconnecting with peer ${data.fromSocketId}`);
        
        const existingPC = peerConnections.get(data.fromSocketId);
        if (existingPC) {
          existingPC.close();
        }
        
        setTimeout(() => {
          const newPC = createPeerConnection(data.fromSocketId);
          
          if (socket.id < data.fromSocketId) {
            console.log(`Creating offer for ${data.fromSocketId} after reconnect request`);
            newPC.createOffer({
              offerToReceiveAudio: true,
              offerToReceiveVideo: true,
              iceRestart: true
            })
              .then(offer => newPC.setLocalDescription(offer))
              .then(() => {
                if (socket && newPC.localDescription) {
                  socket.emit('offer', {
                    sender: socket.id,
                    target: data.fromSocketId,
                    sdp: newPC.localDescription,
                    roomId
                  });
                }
              })
              .catch(err => console.error('Error creating offer after reconnect:', err));
          }
        }, 20); // Ultra-fast timeout
      }
    };
    
    // Register event listeners
    socket.on('userJoined', handleUserJoined);
    socket.on('offer', handleOffer);
    socket.on('answer', handleAnswer);
    socket.on('iceCandidate', handleIceCandidate);
    socket.on('userLeft', handleUserLeft);
    socket.on('streamReady', handleStreamReady);
    socket.on('connectionRetry', handleConnectionRetry);
    socket.on('reconnectPeers', handleReconnectPeers);
    
    return () => {
      // Clean up event listeners
      socket.off('userJoined', handleUserJoined);
      socket.off('offer', handleOffer);
      socket.off('answer', handleAnswer);
      socket.off('iceCandidate', handleIceCandidate);
      socket.off('userLeft', handleUserLeft);
      socket.off('streamReady', handleStreamReady);
      socket.off('connectionRetry', handleConnectionRetry);
      socket.off('reconnectPeers', handleReconnectPeers);
    };
  }, [socket, localStream, activeUsers, user, peerConnections, remoteStreams, iceCandidatesBuffer, roomId]);
  
  // Create and configure a peer connection
  const createPeerConnection = (remoteUserId: string) => {
    if (!socket || !localStream || !user) return null;
    
    const userId = user.id || user._id;
    if (!userId) return null;
    
    // Use existing connection if available
    if (peerConnections.has(remoteUserId)) {
      return peerConnections.get(remoteUserId)!;
    }
    
    // Track connection attempts for this peer
    const attempts = connectionAttempts.current.get(remoteUserId) || 0;
    connectionAttempts.current.set(remoteUserId, attempts + 1);
    
    // Create new peer connection with optimized configuration
    const pc = new RTCPeerConnection({
      iceServers,
      iceCandidatePoolSize: 5,
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require',
      iceTransportPolicy: 'all'
    });
    
    // Cache the connection for potential reuse
    peerConnectionCache.set(remoteUserId, pc);
    
    // Add local tracks to the connection
    if (localStream) {
      console.log(`Adding ${localStream.getTracks().length} local tracks to peer connection`);
      
      localStream.getTracks().forEach(track => {
        console.log(`Adding track: ${track.kind} (${track.enabled ? 'enabled' : 'disabled'})`);
        const sender = pc.addTrack(track, localStream);
        
        // Optimize encoding parameters based on track type
        if (sender.setParameters && sender.getParameters) {
          try {
            const params = sender.getParameters();
            if (track.kind === 'video' && params.encodings) {
              // Ultra-low video bitrate for initial connection
              params.encodings.forEach(encoding => {
                encoding.maxBitrate = 100000; // 100 Kbps for video
                encoding.priority = 'low';
              });
              sender.setParameters(params).catch(e => console.warn('Could not set video parameters:', e));
            } else if (track.kind === 'audio' && params.encodings) {
              // Prioritize audio quality and stability
              params.encodings.forEach(encoding => {
                encoding.maxBitrate = 24000; // Adequate for voice
                encoding.priority = 'high';
              });
              sender.setParameters(params).catch(e => console.warn('Could not set audio parameters:', e));
            }
          } catch (e) {
            console.warn('Could not set encoding parameters:', e);
          }
        }
      });
    }
    
    // Handle incoming tracks
    pc.ontrack = (event) => {
      console.log(`Received tracks from ${remoteUserId}:`, event.streams);
      if (event.streams && event.streams[0]) {
        const stream = event.streams[0];
        
        // Create audio context for volume boost (4-5x amplification)
        try {
          if (window.AudioContext || (window as any).webkitAudioContext) {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            const audioContext = new AudioContextClass();
            audioContexts.current.set(remoteUserId, audioContext);
            
            const source = audioContext.createMediaStreamSource(stream);
            const gainNode = audioContext.createGain();
            gainNode.gain.value = 4.5; // Boost volume 4.5x (significantly louder)
            audioGainNodes.current.set(remoteUserId, gainNode);
            
            source.connect(gainNode);
            const destination = audioContext.createMediaStreamDestination();
            gainNode.connect(destination);
            
            // Replace audio tracks with amplified ones
            const audioTracks = stream.getAudioTracks();
            audioTracks.forEach(track => {
              stream.removeTrack(track);
            });
            
            destination.stream.getAudioTracks().forEach(track => {
              stream.addTrack(track);
            });
          }
        } catch (e) {
          console.warn('Error setting up audio amplification:', e);
        }
        
        setRemoteStreams(prev => {
          const newMap = new Map(prev);
          newMap.set(remoteUserId, stream);
          return newMap;
        });
        
        setConnectionStatus(prev => {
          const newStatus = new Map(prev);
          newStatus.set(remoteUserId, 'connected');
          return newStatus;
        });
        
        const videoElement = remoteVideoRefs.current.get(remoteUserId);
        if (videoElement) {
          videoElement.srcObject = stream;
          
          try {
            videoElement.playsInline = true;
            videoElement.autoplay = true;
            videoElement.muted = false;
            videoElement.volume = 1.0;
          } catch (e) {
            console.warn('Error setting video element properties:', e);
          }
          
          // Force play with retry
          const playWithRetry = (attempts = 0) => {
            videoElement.play().catch(e => {
              console.error("Remote video autoplay failed:", e);
              if (attempts < 3) {
                setTimeout(() => playWithRetry(attempts + 1), 100);
              } else {
                console.error("Failed to autoplay after retries. Browser may require user interaction.");
                // No longer muting here as this defeats the purpose
                // Just continue trying to play
                setTimeout(() => playWithRetry(attempts + 1), 1000);
              }
            });
          };
          
          playWithRetry();
        }
        
        if (connectionTimeouts.current.has(remoteUserId)) {
          clearTimeout(connectionTimeouts.current.get(remoteUserId)!);
          connectionTimeouts.current.delete(remoteUserId);
        }
      }
    };
    
    // ICE candidate handling
    pc.onicecandidate = (event) => {
      if (event.candidate && socket && socket.connected) {
        // Record time of last ICE candidate
        lastIceCandidateTime.current.set(remoteUserId, Date.now());
        
        socket.emit('iceCandidate', {
          sender: socket.id,
          target: remoteUserId,
          candidate: event.candidate,
          roomId
        });
      } else if (!event.candidate) {
        console.log('ICE candidate gathering complete');
        
        // Set timeout to force connection if ICE gathering takes too long
        setTimeout(() => {
          const status = connectionStatus.get(remoteUserId);
          if (status !== 'connected' && status !== 'completed') {
            console.log('ICE gathering timed out, forcing connection attempt');
            socket.emit('retryConnection', {
              targetId: remoteUserId,
              roomId
            });
          }
        }, ICE_GATHERING_TIMEOUT);
      }
    };
    
    // Connection negotiation
    pc.onnegotiationneeded = () => {
      if (socket && socket.id < remoteUserId) {
        console.log(`Creating offer to ${remoteUserId} after negotiation needed`);
        pc.createOffer({ 
          offerToReceiveAudio: true, 
          offerToReceiveVideo: true,
          iceRestart: true
        })
          .then(offer => {
            return pc.setLocalDescription(offer);
          })
          .then(() => {
            if (socket && pc.localDescription) {
              socket.emit('offer', {
                sender: socket.id,
                target: remoteUserId,
                sdp: pc.localDescription,
                roomId
              });
            }
          })
          .catch(err => {
            console.error('Error creating offer after negotiation needed:', err);
            
            // Rapid retry on error
            setTimeout(() => {
              socket.emit('retryConnection', {
                targetId: remoteUserId,
                roomId
              });
            }, 50);
          });
      }
    };
    
    // ICE connection state handling
    pc.oniceconnectionstatechange = () => {
      console.log(`ICE connection state changed to: ${pc.iceConnectionState} for user ${remoteUserId}`);
      
      setConnectionStatus(prev => {
        const newStatus = new Map(prev);
        newStatus.set(remoteUserId, pc.iceConnectionState);
        return newStatus;
      });
      
      // Fast recovery from connection issues
      if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
        console.log(`Connection ${pc.iceConnectionState} with ${remoteUserId}, attempting immediate retry...`);
        
        if (socket && socket.connected) {
          socket.emit('retryConnection', {
            targetId: remoteUserId,
            roomId
          });
          
          if (pc.restartIce) {
            try {
              pc.restartIce();
            } catch (e) {
              console.warn('Could not restart ICE:', e);
            }
          }
        }
      }
    };
    
    // Connection state handling
    pc.onconnectionstatechange = () => {
      console.log(`Connection state changed to: ${pc.connectionState} for user ${remoteUserId}`);
      
      if (pc.connectionState === 'failed') {
        if (typeof pc.restartIce === 'function') {
          pc.restartIce();
        }
        
        setTimeout(() => {
          if (pc.connectionState === 'failed' && socket && socket.connected) {
            socket.emit('retryConnection', {
              targetId: remoteUserId,
              roomId
            });
          }
        }, 50); // Ultra-fast retry
      }
    };
    
    // Signaling state handling
    pc.onsignalingstatechange = () => {
      console.log(`Signaling state changed to: ${pc.signalingState} for user ${remoteUserId}`);
    };
    
    // Initiate connection if our ID is lower (to avoid duplicating offers)
    if (socket && socket.id < remoteUserId) {
      console.log(`User ${socket.id} initiating connection to ${remoteUserId}`);
      
      // Reuse previous SDP if available for faster reconnection
      const cachedOffer = sdpCache.get(`offer-${remoteUserId}`);
      
      if (cachedOffer && attempts > 0) {
        console.log('Using cached offer for faster reconnection');
        try {
          pc.setLocalDescription(cachedOffer)
            .then(() => {
              socket.emit('offer', {
                sender: socket.id,
                target: remoteUserId,
                sdp: cachedOffer,
                roomId
              });
            })
            .catch(err => {
              console.warn('Error using cached offer:', err);
              createFreshOffer();
            });
        } catch (e) {
          console.warn('Error applying cached offer:', e);
          createFreshOffer();
        }
      } else {
        createFreshOffer();
      }
      
      function createFreshOffer() {
        pc.createOffer({ 
          offerToReceiveAudio: true, 
          offerToReceiveVideo: true,
          iceRestart: true
        })
          .then(offer => {
            sdpCache.set(`offer-${remoteUserId}`, offer);
            return pc.setLocalDescription(offer);
          })
          .then(() => {
            if (socket && pc.localDescription) {
              socket.emit('offer', {
                sender: socket.id,
                target: remoteUserId,
                sdp: pc.localDescription,
                roomId
              });
            }
          })
          .catch(err => {
            console.error('Error creating offer:', err);
            
            toast({
              title: "Connection issue",
              description: "Trying to reconnect...",
              variant: "destructive",
            });
            
            // Immediate retry
            setTimeout(() => {
              socket.emit('retryConnection', {
                targetId: remoteUserId,
                roomId
              });
            }, 50);
          });
      }
    }
    
    // Set a faster connection timeout
    const connectionTimeout = setTimeout(() => {
      const status = connectionStatus.get(remoteUserId);
      if (status !== 'connected' && status !== 'completed') {
        console.log(`Connection timeout for ${remoteUserId}, attempting immediate retry`);
        
        if (socket && socket.connected) {
          socket.emit('retryConnection', {
            targetId: remoteUserId,
            roomId
          });
          
          if (pc.restartIce) {
            try {
              pc.restartIce();
            } catch (e) {
              console.warn('Could not restart ICE:', e);
            }
          }
        }
      }
    }, CONNECTION_TIMEOUT);
    
    connectionTimeouts.current.set(remoteUserId, connectionTimeout);
    
    // Update peer connections state
    setPeerConnections(prev => {
      const newMap = new Map(prev);
      newMap.set(remoteUserId, pc);
      return newMap;
    });
    
    // Update connection status
    setConnectionStatus(prev => {
      const newStatus = new Map(prev);
      newStatus.set(remoteUserId, 'new');
      return newStatus;
    });
    
    return pc;
  };
  
  // Set local video stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      
      try {
        localVideoRef.current.play().catch(e => {
          console.warn('Could not autoplay local video:', e);
        });
      } catch (e) {
        console.warn('Error playing local video:', e);
      }
    }
  }, [localStream]);
  
  // Track enable/disable handling
  useEffect(() => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      if (videoTracks.length > 0) {
        videoTracks.forEach(track => {
          track.enabled = isCameraActive;
        });
      }
      
      const audioTracks = localStream.getAudioTracks();
      if (audioTracks.length > 0) {
        audioTracks.forEach(track => {
          track.enabled = isMicActive;
        });
      }
    }
  }, [isCameraActive, isMicActive, localStream]);
  
  // Toggle audio
  const toggleMic = () => {
    setIsMicActive(!isMicActive);
    
    if (socket) {
      socket.emit('toggleAudio', {
        roomId,
        userId: user?.id || user?._id,
        enabled: !isMicActive
      });
    }
  };
  
  // Toggle video
  const toggleCamera = () => {
    setIsCameraActive(!isCameraActive);
    
    if (socket) {
      socket.emit('toggleVideo', {
        roomId,
        userId: user?.id || user?._id,
        enabled: !isCameraActive
      });
    }
  };
  
  // Retry all connections
  const retryConnections = () => {
    console.log('Manually retrying all connections');
    
    // Close existing connections
    peerConnections.forEach((connection, userId) => {
      connection.close();
    });
    
    // Reset state
    setPeerConnections(new Map());
    setRemoteStreams(new Map());
    setConnectionStatus(new Map());
    setIceCandidatesBuffer(new Map());
    
    if (socket) {
      // Request reconnection
      socket.emit('requestReconnect', { roomId });
      
      // Create new connections with minimal delay
      setTimeout(() => {
        activeUsers.forEach(activeUser => {
          if (activeUser.id !== (user?.id || user?._id)) {
            createPeerConnection(activeUser.id);
          }
        });
      }, 20);
    }
    
    toast({
      title: "Reconnecting",
      description: "Reconnecting to all participants...",
    });
  };
  
  // Leave call
  const leaveCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    
    // Close all peer connections
    peerConnections.forEach(connection => {
      connection.close();
    });
    
    // Reset state
    setPeerConnections(new Map());
    setRemoteStreams(new Map());
    
    // Close all audio contexts
    audioContexts.current.forEach(context => {
      try {
        context.close();
      } catch (e) {
        console.warn('Error closing audio context:', e);
      }
    });
    audioContexts.current.clear();
    audioGainNodes.current.clear();
    
    // Leave room and disconnect
    if (socket) {
      socket.emit('leaveRoom', { roomId, userId: user?.id || user?._id });
      socket.disconnect();
    }
    
    navigate('/rooms');
  };
  
  // Filter participants
  const participants = activeUsers
    .filter(participant => (participant.id !== (user?.id || user?._id)) && participant.id !== socket?.id);
  
  // Helper to get first name
  const getFirstName = (username: string) => {
    return username ? username.split(' ')[0] : '?';
  };
  
  // Render UI
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto space-y-3 p-1">
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
        
        {Array.from(remoteStreams).map(([userId, stream]) => {
          const participant = participants.find(p => p.id === userId || p.socketId === userId);
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
                    el.autoplay = true;
                    el.playsInline = true;
                    el.muted = false;
                    remoteVideoRefs.current.set(userId, el);
                    
                    // Auto-play with persistent retries
                    (function attemptPlay(attempt = 0) {
                      el.play().catch(err => {
                        console.warn(`Auto-play attempt ${attempt} failed:`, err);
                        
                        // Keep trying every 300ms
                        setTimeout(() => {
                          if (attempt < 20) { // Keep trying for ~6 seconds
                            attemptPlay(attempt + 1);
                          }
                        }, 300);
                      });
                    })();
                  }
                }}
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
            const connectionState = connectionStatus.get(participant.id) || 'new';
            
            return (
              <motion.div 
                key={participant.id} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="relative aspect-video bg-gray-800/80 rounded-md overflow-hidden shadow-md"
              >
                <div className="absolute inset-0 flex items-center justify-center flex-col gap-2">
                  <div className="w-16 h-16 rounded-full bg-primary/20 backdrop-blur-sm flex items-center justify-center">
                    <span className="text-lg font-semibold">
                      {participant.username?.charAt(0) || '?'}
                    </span>
                  </div>
                  <div className="text-sm text-center bg-black/20 px-3 py-1 rounded-full">
                    {connectionState === 'failed' || connectionState === 'disconnected' ? (
                      <span className="text-red-400">Reconnecting...</span>
                    ) : connectionState === 'connected' || connectionState === 'completed' ? (
                      <span className="text-green-400">Connected, waiting for media...</span>
                    ) : (
                      <span>Connecting...</span>
                    )}
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
            No other participants in the call yet. Share the room ID for others to join.
          </div>
        )}
      </div>
      
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
          {isCameraActive ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
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
        
        <Button
          size="icon"
          variant="outline"
          onClick={retryConnections}
          className="rounded-full h-12 w-12 shadow-md transition-transform hover:bg-secondary hover:scale-110"
          disabled={isLoading}
        >
          <RefreshCw className="h-5 w-5" />
        </Button>
        
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
              const isConnected = remoteStreams.has(participant.id);
              
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
                      <p className="text-xs text-muted-foreground">
                        {isConnected ? 'Connected' : 'Connecting...'}
                      </p>
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
