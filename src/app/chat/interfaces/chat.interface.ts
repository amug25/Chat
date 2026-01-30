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

  location?: {
    lat: number;
    lng: number;
    accuracy?: number | undefined;
  } | null;
}

export interface InfiniteScrollCustomEvent extends CustomEvent {
  target: HTMLIonInfiniteScrollElement;
}
