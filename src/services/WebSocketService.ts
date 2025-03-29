import { io, Socket } from 'socket.io-client';
import { buildApiUrl } from '@/api/config';

class WebSocketService {
  private static instance: WebSocketService;
  private socket: Socket | null = null;
  private connectionAttempts = 0;
  private maxReconnectAttempts = 5; // Increased for better reliability
  private reconnectDelay = 1000; // Reduced for faster reconnection
  private pingInterval: NodeJS.Timeout | null = null;
  private lastConnectedToken: string | null = null;
  private connectingPromise: Promise<Socket> | null = null;
  private connecting: boolean = false;
  private joinedRooms: Set<string> = new Set();
  private socketId: string | null = null;
  private pingHandler: NodeJS.Timeout | null = null;

  private constructor() {
    console.log("WebSocketService initialized");
  }

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  public connect(token: string): Socket {
    if (this.connecting) {
      console.log("Connection already in progress, returning existing socket");
      return this.socket!;
    }

    if (this.socket && this.socket.connected && token === this.lastConnectedToken) {
      console.log("Using existing socket connection");
      return this.socket;
    }

    if (this.socket) {
      this.cleanupSocket();
    }

    this.connecting = true;
    this.lastConnectedToken = token;
    this.connectionAttempts = 0;

    let socketURL = import.meta.env.VITE_SOCKET_URL || 'https://chat-code-3fz6.onrender.com';
    
    // If in development and connecting to localhost, ensure the correct port
    if (socketURL.includes('localhost') || socketURL.includes('127.0.0.1')) {
      socketURL = 'http://localhost:5000';
    }
    
    console.log(`Connecting to WebSocket at ${socketURL}`);
    
    this.socket = io(socketURL, {
      auth: { token },
      transports: ['websocket', 'polling'], // Try websocket first, fall back to polling
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      timeout: 1000, // Reduced timeout for faster connection
      autoConnect: true,
      forceNew: true, // Force a new connection to avoid reusing problematic connections
    });

    this.setupSocketListeners();
    
    this.socket.on('connect', () => {
      this.socketId = this.socket!.id;
      this.connecting = false;
      console.log(`Socket connected with ID: ${this.socketId}`);
      this.startPingInterval();
      
      // Rejoin any rooms that were previously joined
      this.joinedRooms.forEach(roomId => {
        console.log(`Automatically rejoining room ${roomId} after reconnect`);
        // We don't have userId here, so this needs to be handled elsewhere
      });
    });

    this.socket.on('disconnect', (reason) => {
      console.log(`Socket disconnected: ${reason}`);
      this.socketId = null;
      this.stopPingInterval();
      
      // For certain disconnect reasons, we should immediately try to reconnect
      if (reason === 'io server disconnect' || reason === 'transport close') {
        console.log("Connection lost, attempting immediate reconnection");
        this.socket?.connect();
      }
    });

    return this.socket;
  }

  public reconnect(token: string): Socket {
    this.cleanupSocket();
    
    this.connecting = false;
    // Do not clear joined rooms on reconnect
    // this.joinedRooms.clear();
    
    return this.connect(token);
  }

  private setupSocketListeners() {
    if (!this.socket) return;

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`Reconnection attempt ${attemptNumber}`);
      this.connectionAttempts = attemptNumber;
    });

    this.socket.on('reconnect_failed', () => {
      console.error('Failed to reconnect after maximum attempts');
      this.connecting = false;
      
      // After max reconnect failures, force a clean reconnection
      if (this.lastConnectedToken) {
        console.log("Forcing clean reconnection after failure");
        setTimeout(() => {
          this.reconnect(this.lastConnectedToken!);
        }, 1000);
      }
    });
    
    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`Successfully reconnected after ${attemptNumber} attempts`);
    });
    
    this.socket.on('roomData', (room) => {
      if (room && room._id) {
        console.log(`Successfully joined room: ${room._id}`);
        this.joinedRooms.add(room._id);
      }
    });
  }

  private cleanupSocket() {
    if (this.socket) {
      console.log("Cleaning up socket connection");
      this.socket.offAny();
      
      if (this.socket.connected) {
        // Only emit leave room if connected
        this.joinedRooms.forEach(roomId => {
          console.log(`Emitting leaveRoom for ${roomId} during cleanup`);
          this.socket!.emit('leaveRoom', { roomId });
        });
        
        this.socket.disconnect();
      }
      
      this.socket = null;
    }
    
    this.stopPingInterval();
    // Don't clear joinedRooms here to allow reconnection
    this.socketId = null;
  }

  private startPingInterval() {
    this.stopPingInterval();
    
    this.pingHandler = setInterval(() => {
      if (this.socket && this.socket.connected) {
        console.log("Sending ping to server");
        this.socket.emit('ping');
      } else {
        this.stopPingInterval();
      }
    }, 15000); // Reduced interval for more responsive connection maintenance
  }

  private stopPingInterval() {
    if (this.pingHandler) {
      clearInterval(this.pingHandler);
      this.pingHandler = null;
    }
  }

  public joinRoom(roomId: string, userId: string, password?: string) {
    if (!this.socket) {
      console.error("Cannot join room: socket not connected");
      return;
    }

    if (!roomId || !userId) {
      console.error("Cannot join room: missing roomId or userId");
      return;
    }

    if (this.joinedRooms.has(roomId)) {
      console.log(`Already joined room ${roomId}, skipping join request`);
      return;
    }

    console.log(`Emitting joinRoom for ${roomId} with user ${userId}${password ? ' and password' : ''}`);
    this.socket.emit('joinRoom', { roomId, userId, password });
    
    // Optimistically add to joined rooms - will be confirmed by server response
    this.joinedRooms.add(roomId);
  }

  public leaveRoom(roomId: string, userId: string) {
    if (!this.socket || !this.socket.connected) {
      console.log(`Cannot leave room ${roomId}: socket not connected`);
      this.joinedRooms.delete(roomId); // Still remove from tracked rooms
      return;
    }

    if (!roomId || !userId) {
      console.error("Cannot leave room: missing roomId or userId");
      return;
    }

    console.log(`Leaving room ${roomId} with user ${userId}`);
    this.socket.emit('leaveRoom', { roomId, userId });
    this.joinedRooms.delete(roomId);
  }

  public hasJoinedRoom(roomId: string): boolean {
    return this.joinedRooms.has(roomId);
  }

  public getSocketId(): string | null {
    return this.socketId;
  }

  public disconnect() {
    this.cleanupSocket();
    // Clear joined rooms on explicit disconnect
    this.joinedRooms.clear();
  }
  
  // Add method to check and rebuild connection if needed
  public ensureConnection(token: string): Socket {
    if (!this.socket || !this.socket.connected) {
      console.log("Socket not connected, establishing new connection");
      return this.connect(token);
    }
    return this.socket;
  }
}

export default WebSocketService;
