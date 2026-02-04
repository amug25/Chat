import { Injectable } from '@angular/core';
import { Geolocation } from '@capacitor/geolocation';

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
        timeout: 10000,
        maximumAge: 90000,
      });
      const location: MessageLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy ?? undefined,
      };
      return location;
    } catch (e) {
      console.log(e);
      return null;
    }
  }
}
