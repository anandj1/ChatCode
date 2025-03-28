
import { useState, useCallback, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { buildApiUrl } from '@/api/config';
import WebSocketService from '@/services/WebSocketService';

interface UseRoomAccessProps {
  onSuccess: (roomId: string, password?: string) => void;
  onError?: (error: string) => void;
}

export const useRoomAccess = ({ onSuccess, onError }: UseRoomAccessProps) => {
  const [loading, setLoading] = useState(false);
  const { token, user } = useAuth();
  const { toast } = useToast();
  const wsService = useRef(WebSocketService.getInstance());
  const [lastJoinedRoom, setLastJoinedRoom] = useState<{roomId: string, password?: string} | null>(null);
  const joinAttemptTimeout = useRef<NodeJS.Timeout | null>(null);
  const [joinInProgress, setJoinInProgress] = useState(false);
  const allowRetry = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Clear any existing timeouts on unmount
  useEffect(() => {
    return () => {
      if (joinAttemptTimeout.current) {
        clearTimeout(joinAttemptTimeout.current);
        joinAttemptTimeout.current = null;
      }
      
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      
      setLastJoinedRoom(null);
      setJoinInProgress(false);
      allowRetry.current = true;
    };
  }, []);

  const joinRoom = useCallback(async (roomId: string, password?: string) => {
    if (!token || !user?.id) {
      const errorMessage = "You must be logged in to join a room";
      toast({
        title: "Authentication required",
        description: errorMessage,
        variant: "destructive",
      });
      if (onError) onError(errorMessage);
      return;
    }

    if (joinInProgress) {
      console.log("Join already in progress, ignoring duplicate call");
      return;
    }

    // Clear any existing timeout
    if (joinAttemptTimeout.current) {
      clearTimeout(joinAttemptTimeout.current);
    }
    
    // Cancel any in-progress fetch requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create a new abort controller for this request
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    
    // Set a timeout to handle cases where the join attempt doesn't complete
    joinAttemptTimeout.current = setTimeout(() => {
      console.log("Join attempt timed out, cleaning up");
      setLoading(false);
      setJoinInProgress(false);
      allowRetry.current = true;
      
      // Cancel the fetch if it's still in progress
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      
      const errorMessage = "Join attempt timed out. Please try again.";
      
      toast({
        title: "Join room failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      if (onError) onError(errorMessage);
    }, 15000);

    setLoading(true);
    setJoinInProgress(true);
    setLastJoinedRoom({ roomId, password });
    
    try {
      console.log(`Checking room access for room ${roomId}`);
      const checkResponse = await fetch(buildApiUrl(`rooms/${roomId}`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        signal
      });
      
      console.log(`Room check response status: ${checkResponse.status}`);
      
      if (checkResponse.ok) {
        console.log("Room access granted, connecting to websocket");
        
        const wsInstance = wsService.current;
        if (wsInstance) {
          const socket = wsInstance.connect(token);
          
          // Ensure socket is connected before attempting to join room
          if (socket.connected) {
            console.log(`Joining room ${roomId} with user ${user.id}`);
            wsInstance.joinRoom(roomId, user.id);
          } else {
            console.log("Socket not connected, waiting to connect");
            socket.once('connect', () => {
              console.log(`Socket connected, now joining room ${roomId}`);
              wsInstance.joinRoom(roomId, user.id);
            });
          }
        } else {
          console.error("WebSocketService not available");
        }
        
        toast({
          title: "Room joined",
          description: "Successfully connected to room",
          variant: "success",
        });
        
        if (joinAttemptTimeout.current) {
          clearTimeout(joinAttemptTimeout.current);
          joinAttemptTimeout.current = null;
        }
        
        setLoading(false);
        setJoinInProgress(false);
        allowRetry.current = true;
        onSuccess(roomId, password);
        return;
      }
      
      if (checkResponse.status === 403) {
        const errorData = await checkResponse.json();
        
        if (errorData.passwordRequired) {
          const errorMessage = "This room requires a password to join";
          
          toast({
            title: "Password required",
            description: errorMessage,
            variant: "warning",
          });
          
          if (onError) onError(errorMessage);
          setLoading(false);
          setJoinInProgress(false);
          allowRetry.current = true;
          
          if (joinAttemptTimeout.current) {
            clearTimeout(joinAttemptTimeout.current);
            joinAttemptTimeout.current = null;
          }
          
          return;
        }
      }
      
      if (password) {
        console.log(`Attempting to join private room ${roomId} with password`);
        const joinResponse = await fetch(buildApiUrl(`rooms/${roomId}/join`), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Expires': '0'
          },
          body: JSON.stringify({ password }),
          signal
        });
        
        console.log(`Join response status: ${joinResponse.status}`);
        
        if (!joinResponse.ok) {
          const errorData = await joinResponse.json();
          throw new Error(errorData.message || 'Failed to join room');
        }
        
        const wsInstance = wsService.current;
        if (wsInstance) {
          const socket = wsInstance.reconnect(token);
          
          // Ensure socket is connected before attempting to join
          if (socket.connected) {
            console.log(`Joining room ${roomId} with user ${user.id} after password verification`);
            wsInstance.joinRoom(roomId, user.id);
          } else {
            console.log("Socket not connected after password verification, waiting to connect");
            socket.once('connect', () => {
              console.log(`Socket connected after password verification, now joining room ${roomId}`);
              wsInstance.joinRoom(roomId, user.id);
            });
          }
        }
        
        toast({
          title: "Room joined",
          description: "You have successfully joined the room",
          variant: "success",
        });
        
        if (joinAttemptTimeout.current) {
          clearTimeout(joinAttemptTimeout.current);
          joinAttemptTimeout.current = null;
        }
        
        setLoading(false);
        setJoinInProgress(false);
        allowRetry.current = true;
        onSuccess(roomId, password);
        return;
      }
      
      const errorData = await checkResponse.json();
      throw new Error(errorData.message || 'Failed to access room');
        
    } catch (error) {
      // Don't process errors from aborted requests
      if (error instanceof Error && error.name === 'AbortError') {
        console.log("Request was aborted");
        return;
      }
      
      console.error("Failed to join room:", error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Failed to join room. Please check the room ID and password.";
      
      toast({
        title: "Failed to join room",
        description: errorMessage,
        variant: "destructive",
      });
      
      if (onError) onError(errorMessage);
      
      if (joinAttemptTimeout.current) {
        clearTimeout(joinAttemptTimeout.current);
        joinAttemptTimeout.current = null;
      }
      
      setLoading(false);
      setJoinInProgress(false);
      allowRetry.current = true;
    }
  }, [token, user, toast, onSuccess, onError]);

  return {
    joinRoom,
    loading,
    lastJoinedRoom
  };
};
