
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

// Optimized and geographically diverse list of STUN/TURN servers for India connections
const iceServers = [
  // Google STUN servers (globally distributed)
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
  
  // India regional STUN servers
  { urls: 'stun:stun.sipgate.net' }, // Good connectivity to Asia
  { urls: 'stun:stun.voxgratia.org' },
  { urls: 'stun:stun.services.mozilla.com' },
  
  // Public STUN servers with good connectivity in Asia
  { urls: 'stun:stun.stunprotocol.org:3478' },
  { urls: 'stun:stun.voipbuster.com' },
  { urls: 'stun:stun.counterpath.com:3478' },
  { urls: 'stun:stun.counterpath.net:3478' },
  { urls: 'stun:stun.1und1.de:3478' },
  { urls: 'stun:stun.gmx.net:3478' },
  { urls: 'stun:stun.ipfire.org:3478' },
  { urls: 'stun:stun.ippi.fr:3478' },
  { urls: 'stun:stun.qq.com' }, // China/Asia region
  
  // TURN servers essential for NAT traversal in restrictive networks (common in India)
  { 
    urls: 'turn:openrelay.metered.ca:80', 
    username: 'openrelayproject', 
    credential: 'openrelayproject'
  },
  { 
    urls: 'turn:openrelay.metered.ca:443', 
    username: 'openrelayproject', 
    credential: 'openrelayproject'
  },
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
    urls: 'turn:turn.anyfirewall.com:443',
    username: 'webrtc',
    credential: 'webrtc'
  },
  {
    urls: 'turn:relay.metered.ca:80',
    username: 'ba6a513cc3f4d431a554',
    credential: 'y+r3nHXLyGGg4Kyk'
  },
  {
    urls: 'turn:relay.metered.ca:443',
    username: 'ba6a513cc3f4d431a554',
    credential: 'y+r3nHXLyGGg4Kyk'
  },
  {
    urls: 'turn:relay.metered.ca:443?transport=tcp',
    username: 'ba6a513cc3f4d431a554',
    credential: 'y+r3nHXLyGGg4Kyk'
  },
  // Singapore region TURN server for Asia/India connections
  {
    urls: 'turn:singapore.relay.metered.ca:80',
    username: 'ba6a513cc3f4d431a554',
    credential: 'y+r3nHXLyGGg4Kyk'
  },
  {
    urls: 'turn:singapore.relay.metered.ca:443',
    username: 'ba6a513cc3f4d431a554',
    credential: 'y+r3nHXLyGGg4Kyk'
  }
];

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
  
  useEffect(() => {
    return () => {
      connectionTimeouts.current.forEach((timeout) => {
        clearTimeout(timeout);
      });
    };
  }, []);
  
  useEffect(() => {
    const getMedia = async () => {
      try {
        console.log('Requesting user media (camera & microphone)');
        
        // Very low resolution and framerate for initial fast connection
        // Optimized for Indian internet connections
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: {
            width: { ideal: 160, max: 240 }, // Very low resolution for initial connection
            height: { ideal: 120, max: 180 },
            facingMode: "user",
            frameRate: { ideal: 8, max: 12 } // Lower framerate for better performance on limited bandwidth
          }, 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 16000, // Lower sample rate for better network performance
            channelCount: 1 // Mono audio to reduce bandwidth
          } 
        });
        
        console.log(`Stream obtained with ${stream.getTracks().length} tracks:`, 
          stream.getTracks().map(t => `${t.kind}: ${t.label} (${t.enabled ? 'enabled' : 'disabled'})`).join(', '));
        
        // Set audio track constraints for better performance
        stream.getAudioTracks().forEach(track => {
          if (track.getConstraints) {
            try {
              track.applyConstraints({
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
              });
            } catch (e) {
              console.warn('Could not apply audio constraints:', e);
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
          
          // Faster timeout for rapid connection
          setTimeout(() => {
            retryConnections();
          }, 50);
        }
        
      } catch (error) {
        console.error("Error accessing media devices:", error);
        
        // Try fallback to just audio if video fails
        try {
          console.log('Trying audio-only as fallback');
          const audioOnlyStream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
              sampleRate: 16000,
              channelCount: 1
            },
            video: false
          });
          
          setLocalStream(audioOnlyStream);
          setIsCameraActive(false);
          setIsLoading(false);
          
          toast({
            title: "Camera not available",
            description: "Using audio only mode.",
            variant: "warning",
          });
          
          if (socket) {
            socket.emit('streamReady', {
              roomId,
              userId: user?.id || user?._id
            });
            
            // Faster reconnect for audio-only
            setTimeout(() => {
              retryConnections();
            }, 50);
          }
        } catch (audioError) {
          console.error("Error accessing audio devices:", audioError);
          setIsLoading(false);
          
          toast({
            title: "Media access failed",
            description: "Could not access camera or microphone. Check permissions.",
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
  
  useEffect(() => {
    if (!socket || !localStream || !user) return;
    
    const userId = user.id || user._id;
    if (!userId) return;
    
    console.log('Setting up WebRTC connections with active users:', activeUsers);
    
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
      console.log('Received offer:', data);
      
      if (data.target === socket.id) {
        console.log(`Got offer from ${data.sender}, creating answer`);
        
        const pc = peerConnections.get(data.sender) || createPeerConnection(data.sender);
        
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
          console.log('Remote description set successfully from offer');
          
          const bufferedCandidates = iceCandidatesBuffer.get(data.sender) || [];
          console.log(`Applying ${bufferedCandidates.length} buffered ICE candidates for ${data.sender}`);
          
          for (const candidate of bufferedCandidates) {
            try {
              await pc.addIceCandidate(candidate);
              console.log('Applied buffered ICE candidate');
            } catch (err) {
              console.error('Error applying buffered ICE candidate:', err);
            }
          }
          
          const answer = await pc.createAnswer();
          console.log('Created answer:', answer);
          
          await pc.setLocalDescription(answer);
          console.log('Local description set successfully for answer');
          
          console.log(`Sending answer to ${data.sender}`);
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
          setConnectionStatus(prev => {
            const newStatus = new Map(prev);
            newStatus.set(data.sender, 'failed');
            return newStatus;
          });
          
          toast({
            title: "Connection error",
            description: "Failed to establish video connection. Try refreshing.",
            variant: "destructive",
          });
        }
      }
    };
    
    const handleAnswer = async (data: any) => {
      console.log('Received answer:', data);
      if (data.target === socket.id) {
        const pc = peerConnections.get(data.sender);
        if (pc) {
          console.log(`Setting remote description from ${data.sender}`);
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
            console.log('Remote description set successfully from answer');
            
            const bufferedCandidates = iceCandidatesBuffer.get(data.sender) || [];
            console.log(`Applying ${bufferedCandidates.length} buffered ICE candidates after answer`);
            
            for (const candidate of bufferedCandidates) {
              try {
                await pc.addIceCandidate(candidate);
                console.log('Applied buffered ICE candidate after answer');
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
            setConnectionStatus(prev => {
              const newStatus = new Map(prev);
              newStatus.set(data.sender, 'failed');
              return newStatus;
            });
          }
        } else {
          console.warn(`Received answer from ${data.sender} but no peer connection exists`);
        }
      }
    };
    
    const handleIceCandidate = async (data: any) => {
      console.log('Received ICE candidate:', data);
      if (data.target === socket.id) {
        const pc = peerConnections.get(data.sender);
        
        if (pc) {
          const iceCandidate = new RTCIceCandidate(data.candidate);
          
          if (pc.remoteDescription && pc.remoteDescription.type) {
            try {
              await pc.addIceCandidate(iceCandidate);
              console.log(`Added ICE candidate from ${data.sender}`);
            } catch (error) {
              console.error('Error adding ICE candidate:', error);
            }
          } else {
            const newBuffer = new Map(iceCandidatesBuffer);
            const currentBuffer = newBuffer.get(data.sender) || [];
            currentBuffer.push(iceCandidate);
            newBuffer.set(data.sender, currentBuffer);
            setIceCandidatesBuffer(newBuffer);
            console.log(`Buffering ICE candidate from ${data.sender} for future peer connection`);
          }
        } else {
          console.warn(`Received ICE candidate from ${data.sender} but no peer connection exists`);
          
          const newBuffer = new Map(iceCandidatesBuffer);
          const iceCandidate = new RTCIceCandidate(data.candidate);
          const currentBuffer = newBuffer.get(data.sender) || [];
          currentBuffer.push(iceCandidate);
          newBuffer.set(data.sender, currentBuffer);
          setIceCandidatesBuffer(newBuffer);
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
          console.log(`Closing peer connection with user ${remoteUserId}`);
          
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
          
          if (connectionTimeouts.current.has(remoteUserId)) {
            clearTimeout(connectionTimeouts.current.get(remoteUserId)!);
            connectionTimeouts.current.delete(remoteUserId);
          }
        }
      }
    };
    
    const handleStreamReady = (data: any) => {
      console.log('Stream ready event received:', data);
      if (data.userId !== userId) {
        setTimeout(() => {
          const pc = peerConnections.get(data.userId);
          if (pc) {
            console.log(`Peer ${data.userId} is ready with media, renegotiating`);
            pc.createOffer()
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
            console.log(`Creating new peer connection with ${data.userId} after stream ready`);
            createPeerConnection(data.userId);
          }
        }, 50); // Reduced timeout for faster connection
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
      
      setTimeout(() => createPeerConnection(data.sender), 50); // Faster timeout
    };
    
    const handleReconnectPeers = (data: any) => {
      console.log('Reconnect peers event received:', data);
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
        }, 50); // Even faster timeout
      }
    };
    
    socket.on('userJoined', handleUserJoined);
    socket.on('offer', handleOffer);
    socket.on('answer', handleAnswer);
    socket.on('iceCandidate', handleIceCandidate);
    socket.on('userLeft', handleUserLeft);
    socket.on('streamReady', handleStreamReady);
    socket.on('connectionRetry', handleConnectionRetry);
    socket.on('reconnectPeers', handleReconnectPeers);
    
    return () => {
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
  
  const createPeerConnection = (remoteUserId: string) => {
    if (!socket || !localStream || !user) return null;
    
    const userId = user.id || user._id;
    if (!userId) return null;
    
    if (peerConnections.has(remoteUserId)) {
      console.log(`Using existing peer connection for user ${remoteUserId}`);
      return peerConnections.get(remoteUserId)!;
    }
    
    console.log(`Creating new RTCPeerConnection for user ${remoteUserId} with ICE servers`, iceServers);
    
    const pc = new RTCPeerConnection({
      iceServers,
      iceCandidatePoolSize: 10,
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require',
      iceTransportPolicy: 'all'
    });
    
    if (localStream) {
      console.log(`Adding ${localStream.getTracks().length} local tracks to peer connection`);
      
      localStream.getTracks().forEach(track => {
        console.log(`Adding track: ${track.kind} (${track.enabled ? 'enabled' : 'disabled'})`);
        const sender = pc.addTrack(track, localStream);
        
        if (sender.setParameters && sender.getParameters) {
          try {
            const params = sender.getParameters();
            if (track.kind === 'video' && params.encodings) {
              params.encodings.forEach(encoding => {
                encoding.maxBitrate = 150000;
                encoding.priority = 'low';
              });
              sender.setParameters(params).catch(e => console.warn('Could not set video parameters:', e));
            } else if (track.kind === 'audio' && params.encodings) {
              // Prioritize audio quality
              params.encodings.forEach(encoding => {
                encoding.maxBitrate = 32000; // Slightly higher for better audio
                encoding.priority = 'high';
              });
              sender.setParameters(params).catch(e => console.warn('Could not set audio parameters:', e));
            }
          } catch (e) {
            console.warn('Could not set encoding parameters:', e);
          }
        }
      });
    } else {
      console.warn('No local stream available to add to the peer connection');
    }
    
    pc.ontrack = (event) => {
      console.log(`Received tracks from ${remoteUserId}:`, event.streams);
      if (event.streams && event.streams[0]) {
        const stream = event.streams[0];
        console.log(`Setting remote stream for user ${remoteUserId} with ${stream.getTracks().length} tracks`);
        
        stream.getAudioTracks().forEach(track => {
          try {
            track.applyConstraints({
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            }).catch(e => console.warn('Could not apply audio constraints to remote track:', e));
          } catch (e) {
            console.warn('Error applying constraints to remote audio:', e);
          }
        });
        
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
          
          videoElement.play().catch(e => {
            console.error("Remote video autoplay failed:", e);
            videoElement.muted = true;
            videoElement.play().catch(err => {
              console.error("Muted remote video autoplay also failed:", err);
              const parent = videoElement.parentElement;
              if (parent) {
                const playButton = document.createElement('button');
                playButton.innerText = 'Click to Play';
                playButton.className = 'absolute inset-0 bg-black/50 flex items-center justify-center text-white';
                playButton.onclick = () => {
                  videoElement.play();
                  playButton.remove();
                };
                parent.appendChild(playButton);
              }
            });
          });
        }
        
        if (connectionTimeouts.current.has(remoteUserId)) {
          clearTimeout(connectionTimeouts.current.get(remoteUserId)!);
          connectionTimeouts.current.delete(remoteUserId);
        }
      }
    };
    
    pc.onicecandidate = (event) => {
      if (event.candidate && socket && socket.connected) {
        console.log(`Sending ICE candidate to ${remoteUserId}`);
        socket.emit('iceCandidate', {
          sender: socket.id,
          target: remoteUserId,
          candidate: event.candidate,
          roomId
        });
      } else if (!event.candidate) {
        console.log('ICE candidate gathering complete');
      }
    };
    
    pc.onnegotiationneeded = () => {
      console.log(`Negotiation needed for connection with ${remoteUserId}`);
      
      if (socket && socket.id < remoteUserId) {
        console.log(`Creating offer to ${remoteUserId} after negotiation needed`);
        pc.createOffer({ 
          offerToReceiveAudio: true, 
          offerToReceiveVideo: true,
          iceRestart: true
        })
          .then(offer => {
            console.log(`Created offer for ${remoteUserId}:`, offer);
            return pc.setLocalDescription(offer);
          })
          .then(() => {
            if (socket && pc.localDescription) {
              console.log(`Sending offer to ${remoteUserId}`);
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
          });
      }
    };
    
    pc.oniceconnectionstatechange = () => {
      console.log(`ICE connection state changed to: ${pc.iceConnectionState} for user ${remoteUserId}`);
      
      setConnectionStatus(prev => {
        const newStatus = new Map(prev);
        newStatus.set(remoteUserId, pc.iceConnectionState);
        return newStatus;
      });
      
      if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'checking' && connectionTimeouts.current.has(remoteUserId)) {
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
    
    pc.onconnectionstatechange = () => {
      console.log(`Connection state changed to: ${pc.connectionState} for user ${remoteUserId}`);
      
      if (pc.connectionState === 'failed') {
        console.log(`Connection with ${remoteUserId} failed, will try to restart ICE`);
        
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
        }, 300); // Faster timeout
      }
    };
    
    pc.onsignalingstatechange = () => {
      console.log(`Signaling state changed to: ${pc.signalingState} for user ${remoteUserId}`);
    };
    
    if (socket && socket.id < remoteUserId) {
      console.log(`User ${socket.id} initiating connection to ${remoteUserId}`);
      
      pc.createOffer({ 
        offerToReceiveAudio: true, 
        offerToReceiveVideo: true,
        iceRestart: true
      })
        .then(offer => {
          console.log(`Created offer for ${remoteUserId}:`, offer);
          return pc.setLocalDescription(offer);
        })
        .then(() => {
          if (socket && pc.localDescription) {
            console.log(`Sending offer to ${remoteUserId}`);
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
            title: "Connection error",
            description: "Failed to connect to other participant. Try refreshing.",
            variant: "destructive",
          });
        });
    }
    
    // Reduce timeout to 3 seconds for faster connection recovery 
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
    }, 3000);
    
    connectionTimeouts.current.set(remoteUserId, connectionTimeout);
    
    setPeerConnections(prev => {
      const newMap = new Map(prev);
      newMap.set(remoteUserId, pc);
      return newMap;
    });
    
    setConnectionStatus(prev => {
      const newStatus = new Map(prev);
      newStatus.set(remoteUserId, 'new');
      return newStatus;
    });
    
    return pc;
  };
  
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      console.log('Setting local video stream with tracks:', 
        localStream.getTracks().map(t => `${t.kind}: ${t.label} (${t.enabled ? 'enabled' : 'disabled'})`).join(', '));
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);
  
  useEffect(() => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      if (videoTracks.length > 0) {
        videoTracks.forEach(track => {
          track.enabled = isCameraActive;
        });
        console.log(`Local camera ${isCameraActive ? 'enabled' : 'disabled'}`);
      }
      
      const audioTracks = localStream.getAudioTracks();
      if (audioTracks.length > 0) {
        audioTracks.forEach(track => {
          track.enabled = isMicActive;
        });
        console.log(`Local microphone ${isMicActive ? 'enabled' : 'disabled'}`);
      }
    }
  }, [isCameraActive, isMicActive, localStream]);
  
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
  
  const retryConnections = () => {
    console.log('Manually retrying all connections');
    
    peerConnections.forEach((connection, userId) => {
      connection.close();
    });
    
    setPeerConnections(new Map());
    setRemoteStreams(new Map());
    setConnectionStatus(new Map());
    setIceCandidatesBuffer(new Map());
    
    if (socket) {
      socket.emit('requestReconnect', { roomId });
      
      setTimeout(() => {
        activeUsers.forEach(activeUser => {
          if (activeUser.id !== (user?.id || user?._id)) {
            createPeerConnection(activeUser.id);
          }
        });
      }, 50); // Even faster than before
    }
    
    toast({
      title: "Reconnecting",
      description: "Attempting to reconnect to all participants...",
    });
  };
  
  const leaveCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    
    peerConnections.forEach(connection => {
      connection.close();
    });
    
    setPeerConnections(new Map());
    setRemoteStreams(new Map());
    
    if (socket) {
      socket.emit('leaveRoom', { roomId, userId: user?.id || user?._id });
      socket.disconnect();
    }
    
    navigate('/rooms');
  };
  
  const participants = activeUsers
    .filter(participant => (participant.id !== (user?.id || user?._id)) && participant.id !== socket?.id);
  
  const getFirstName = (username: string) => {
    return username ? username.split(' ')[0] : '?';
  };
  
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
                    remoteVideoRefs.current.set(userId, el);
                    
                    el.play().catch(e => {
                      console.error("Autoplay failed:", e);
                    
                      el.play().then(() => {
                        const unmute = () => {
                          el.muted = false;
                          document.removeEventListener('click', unmute);
                        };
                        document.addEventListener('click', unmute);
                      }).catch(err => {
                        console.error("Muted autoplay also failed:", err);
                      });
                    });
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
                      <span className="text-red-400">Connection failed</span>
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
