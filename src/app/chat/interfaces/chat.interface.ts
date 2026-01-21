export interface ChatUser {
  uid: string;
  email: string | null;
  displayName?: string;
  photoURL?: string;
  lastLogin?: number;
}

export interface ChatMessage {
  uid: string;
  text: string | null;
  timestamp: number | object;
  profilePicUrl?: string | null;
  name: string;
}
