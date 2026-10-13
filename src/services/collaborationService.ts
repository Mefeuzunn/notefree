import { CollabMessage, PeerUser, Stroke } from '../types/notebook';

type MessageListener = (msg: CollabMessage) => void;

class CollaborationService {
  private channel: BroadcastChannel | null = null;
  private roomId: string | null = null;
  private myId: string = `user_${Math.random().toString(36).substring(2, 9)}`;
  private myName: string = 'Öğrenci';
  private myColor: string = '#6366f1';
  private listeners: Set<MessageListener> = new Set();
  private heartbeatTimer: any = null;
  private lastCursorBroadcast: number = 0;

  constructor() {
    // Generate distinct random avatar color & fun student name default
    const colors = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#f43f5e'];
    this.myColor = colors[Math.floor(Math.random() * colors.length)];
  }

  public getMyId(): string {
    return this.myId;
  }

  public getMyColor(): string {
    return this.myColor;
  }

  public getMyName(): string {
    return this.myName;
  }

  public setMyProfile(name: string, color?: string) {
    if (name) this.myName = name;
    if (color) this.myColor = color;
  }

  public joinRoom(roomId: string, name?: string, color?: string) {
    this.leaveRoom();
    this.roomId = roomId.trim().toUpperCase();
    if (name) this.myName = name;
    if (color) this.myColor = color;

    try {
      this.channel = new BroadcastChannel(`notefree_collab_${this.roomId}`);
      this.channel.onmessage = (event) => {
        const msg = event.data as CollabMessage;
        if (!msg || msg.senderId === this.myId) return;
        this.notifyListeners(msg);
      };

      // Announce arrival to room
      this.broadcast({
        type: 'JOIN',
        roomId: this.roomId,
        senderId: this.myId,
        senderName: this.myName,
        senderColor: this.myColor,
        timestamp: Date.now(),
      });

      // Periodic heartbeat
      this.heartbeatTimer = setInterval(() => {
        if (!this.roomId) return;
        this.broadcast({
          type: 'JOIN',
          roomId: this.roomId,
          senderId: this.myId,
          senderName: this.myName,
          senderColor: this.myColor,
          timestamp: Date.now(),
        });
      }, 4000);
    } catch (err) {
      console.warn('BroadcastChannel not supported in this environment', err);
    }
  }

  public leaveRoom() {
    if (this.channel && this.roomId) {
      try {
        this.broadcast({
          type: 'LEAVE',
          roomId: this.roomId,
          senderId: this.myId,
          senderName: this.myName,
          senderColor: this.myColor,
          timestamp: Date.now(),
        });
        this.channel.close();
      } catch (e) {
        // Ignore close error
      }
    }
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    this.channel = null;
    this.roomId = null;
  }

  public broadcast(msg: CollabMessage) {
    if (!this.channel) return;
    try {
      this.channel.postMessage(msg);
    } catch (e) {
      console.warn('Collab broadcast failed:', e);
    }
  }

  public broadcastCursor(x: number, y: number) {
    const now = Date.now();
    // Throttle cursor messages to ~30fps (33ms)
    if (now - this.lastCursorBroadcast < 33) return;
    this.lastCursorBroadcast = now;

    if (!this.roomId) return;
    this.broadcast({
      type: 'CURSOR',
      roomId: this.roomId,
      senderId: this.myId,
      senderName: this.myName,
      senderColor: this.myColor,
      timestamp: now,
      payload: { x, y },
    });
  }

  public broadcastLiveStrokePoints(points: any[], tool: string, color: string, size: number) {
    if (!this.roomId) return;
    this.broadcast({
      type: 'STROKE_POINTS',
      roomId: this.roomId,
      senderId: this.myId,
      senderName: this.myName,
      senderColor: this.myColor,
      timestamp: Date.now(),
      payload: { points, tool, color, size },
    });
  }

  public broadcastAddStroke(stroke: Stroke, pageIndex: number) {
    if (!this.roomId) return;
    this.broadcast({
      type: 'STROKE_END',
      roomId: this.roomId,
      senderId: this.myId,
      senderName: this.myName,
      senderColor: this.myColor,
      timestamp: Date.now(),
      payload: { stroke, pageIndex },
    });
  }

  public broadcastEraseStrokes(strokeIds: string[], pageIndex: number) {
    if (!this.roomId) return;
    this.broadcast({
      type: 'STROKE_ERASE',
      roomId: this.roomId,
      senderId: this.myId,
      senderName: this.myName,
      senderColor: this.myColor,
      timestamp: Date.now(),
      payload: { strokeIds, pageIndex },
    });
  }

  public broadcastStateSync(notebookData: any) {
    if (!this.roomId) return;
    this.broadcast({
      type: 'STATE_SYNC',
      roomId: this.roomId,
      senderId: this.myId,
      senderName: this.myName,
      senderColor: this.myColor,
      timestamp: Date.now(),
      payload: notebookData,
    });
  }

  public subscribe(listener: MessageListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(msg: CollabMessage) {
    this.listeners.forEach((listener) => {
      try {
        listener(msg);
      } catch (err) {
        console.error('Collab listener error:', err);
      }
    });
  }

  public generateRoomCode(): string {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = 'NOTE-';
    for (let i = 0; i < 4; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }
}

export const collaborationService = new CollaborationService();
