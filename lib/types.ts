export interface QueueItem {
  id: string;
  videoId: string;
  title?: string;
  duration?: number;
  addedAt: string;
}

export interface Session {
  sessionId: string;
  hostName?: string;
  queue: QueueItem[];
  currentVideoId?: string;
  createdAt: string;
}

export type SessionPublic = Omit<Session, "queue"> & { queue: QueueItem[] };

export interface SearchResult {
  videoId: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
}
