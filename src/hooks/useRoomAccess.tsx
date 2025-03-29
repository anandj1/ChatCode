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
  const connectionAttemptsRef = useRef(0);

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
      connectionAttemptsRef.current = 0;
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
    // Reduced timeout for faster experience
    joinAttemptTimeout.current = setTimeout(() => {
      console.log("Join attempt timed out, cleaning up");
      
      // Try again if we haven't exceeded max attempts
      if (connectionAttemptsRef.current < 3) {
        connectionAttemptsRef.current++;
        console.log(`Retrying connection, attempt ${connectionAttemptsRef.current}`);
        
        // Cancel the current fetch if it's still in progress
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
          abortControllerRef.current = null;
        }
        
        // Reset join in progress
        setJoinInProgress(false);
        
        // Try to join again after a short delay
        setTimeout(() => {
          joinRoom(roomId, password);
        }, 500);
        
        return;
      }
      
      setLoading(false);
      setJoinInProgress(false);
      allowRetry.current = true;
      connectionAttemptsRef.current = 0;
      
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
    }, 8000); // Reduced timeout for faster experience

    setLoading(true);
    setJoinInProgress(true);
    setLastJoinedRoom({ roomId, password });
    
    try {
      console.log(`Checking room access for room ${roomId}`);
      const checkResponse = await fetch(buildApiUrl(`rooms/${roomId}`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          
         
        
        },
        signal
      });
      
      console.log(`Room check response status: ${checkResponse.status}`);
      
      // If room doesn't require password or user already has access
      if (checkResponse.ok) {
        console.log("Room access granted, connecting to websocket");
        
        const wsInstance = wsService.current;
        if (wsInstance) {
          // Use ensureConnection to make sure we have a valid connection
          const socket = wsInstance.ensureConnection(token);
          
          // Ensure socket is connected before attempting to join room
          if (socket.connected) {
            console.log(`Joining room ${roomId} with user ${user.id}`);
            wsInstance.joinRoom(roomId, user.id);
            
            // Clear timeout since we've connected successfully
            if (joinAttemptTimeout.current) {
              clearTimeout(joinAttemptTimeout.current);
              joinAttemptTimeout.current = null;
            }
            
            toast({
              title: "Room joined",
              description: "Successfully connected to room",
              variant: "success",
            });
            
            setLoading(false);
            setJoinInProgress(false);
            allowRetry.current = true;
            connectionAttemptsRef.current = 0;
            onSuccess(roomId, password);
          } else {
            console.log("Socket not connected, waiting to connect");
            
            // Set up a one-time connect event listener
            socket.once('connect', () => {
              console.log(`Socket connected, now joining room ${roomId}`);
              wsInstance.joinRoom(roomId, user.id, password);
              
              // Clear timeout since we've connected successfully
              if (joinAttemptTimeout.current) {
                clearTimeout(joinAttemptTimeout.current);
                joinAttemptTimeout.current = null;
              }
              
              toast({
                title: "Room joined",
                description: "Successfully connected to room",
                variant: "success",
              });
              
              setLoading(false);
              setJoinInProgress(false);
              allowRetry.current = true;
              connectionAttemptsRef.current = 0;
              onSuccess(roomId, password);
            });
          }
        } else {
          console.error("WebSocketService not available");
          throw new Error("WebSocketService not available");
        }
        
        return;
      }
      
      // Handle case where room requires password
      if (checkResponse.status === 403) {
        const errorData = await checkResponse.json();
        
        if (errorData.passwordRequired && !password) {
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
          connectionAttemptsRef.current = 0;
          
          if (joinAttemptTimeout.current) {
            clearTimeout(joinAttemptTimeout.current);
            joinAttemptTimeout.current = null;
          }
          
          return;
        }
      }
      
      // If we have a password, attempt to join with password
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
          // Use ensureConnection instead of reconnect to avoid unnecessary disconnections
          const socket = wsInstance.ensureConnection(token);
          
          // Ensure socket is connected before attempting to join
          if (socket.connected) {
            console.log(`Joining room ${roomId} with user ${user.id} after password verification`);
            wsInstance.joinRoom(roomId, user.id, password);
            
            // Clear timeout since we've connected successfully
            if (joinAttemptTimeout.current) {
              clearTimeout(joinAttemptTimeout.current);
              joinAttemptTimeout.current = null;
            }
            
            toast({
              title: "Room joined",
              description: "You have successfully joined the room",
              variant: "success",
            });
            
            setLoading(false);
            setJoinInProgress(false);
            allowRetry.current = true;
            connectionAttemptsRef.current = 0;
            onSuccess(roomId, password);
          } else {
            console.log("Socket not connected after password verification, waiting to connect");
            
            // Set up a one-time connect event listener
            socket.once('connect', () => {
              console.log(`Socket connected after password verification, now joining room ${roomId}`);
              wsInstance.joinRoom(roomId, user.id, password);
              
              // Clear timeout since we've connected successfully
              if (joinAttemptTimeout.current) {
                clearTimeout(joinAttemptTimeout.current);
                joinAttemptTimeout.current = null;
              }
              
              toast({
                title: "Room joined",
                description: "You have successfully joined the room",
                variant: "success",
              });
              
              setLoading(false);
              setJoinInProgress(false);
              allowRetry.current = true;
              connectionAttemptsRef.current = 0;
              onSuccess(roomId, password);
            });
          }
        } else {
          console.error("WebSocketService not available");
          throw new Error("WebSocketService not available");
        }
        
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
      connectionAttemptsRef.current = 0;
    }
  }, [token, user, toast, onSuccess, onError]);

  return {
    joinRoom,
    loading,
    lastJoinedRoom
  };
};
