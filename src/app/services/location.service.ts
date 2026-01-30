import { Injectable } from '@angular/core';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

export type MessageLocation = {
  lat: number;
  lng: number;
  accuracy?: number;
};

@Injectable({
  providedIn: 'root',
})
export class LocationService {
  async getCurrentLocation(): Promise<MessageLocation | null> {
    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 9000,
        maximumAge: 0,
      });
      const location: MessageLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy ?? undefined,
      };
      return location;
    } catch (e) {
      return null;
    }
  }
}
