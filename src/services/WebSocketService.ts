import { io, Socket } from 'socket.io-client';
import { buildApiUrl } from '@/api/config';

class WebSocketService {
  private static instance: WebSocketService;
  private socket: Socket | null = null;
  private connectionAttempts = 0;
  private maxReconnectAttempts = 3;
  private reconnectDelay = 2000;
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

    const apiUrl = buildApiUrl('').replace(/^http/, 'ws');
    const baseUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
    const wsUrl = baseUrl.replace('/api', '');

    console.log(`Connecting to WebSocket at ${wsUrl}`);
    
    this.socket = io(wsUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      timeout: 10000,
      autoConnect: true
    });

    this.setupSocketListeners();
    
    this.socket.on('connect', () => {
      this.socketId = this.socket!.id;
      this.connecting = false;
      console.log(`Socket connected with ID: ${this.socketId}`);
      this.startPingInterval();
    });

    this.socket.on('disconnect', (reason) => {
      console.log(`Socket disconnected: ${reason}`);
      this.socketId = null;
      this.stopPingInterval();
    });

    return this.socket;
  }

  public reconnect(token: string): Socket {
    this.cleanupSocket();
    
    this.connecting = false;
    this.joinedRooms.clear();
    
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
      this.socket.offAny();
      
      if (this.socket.connected) {
        this.joinedRooms.forEach(roomId => {
          this.socket!.emit('leaveRoom', { roomId });
        });
        
        this.socket.disconnect();
      }
      
      this.socket = null;
    }
    
    this.stopPingInterval();
    this.joinedRooms.clear();
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
    }, 25000);
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

    console.log(`Emitting joinRoom for ${roomId} with user ${userId}`);
    this.socket.emit('joinRoom', { roomId, userId, password });
  }

  public leaveRoom(roomId: string, userId: string) {
    if (!this.socket || !this.socket.connected) {
      console.log(`Cannot leave room ${roomId}: socket not connected`);
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
  }
}

export default WebSocketService;
