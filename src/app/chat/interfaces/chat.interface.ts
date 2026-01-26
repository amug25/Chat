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
  id?: string;
  timestamp: number | object;
  profilePicUrl?: string | null;
  name: string;
}

export interface InfiniteScrollCustomEvent extends CustomEvent {
  target: HTMLIonInfiniteScrollElement;
}
