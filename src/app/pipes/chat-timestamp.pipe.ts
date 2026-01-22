import { Pipe, type PipeTransform } from '@angular/core';

@Pipe({
  name: 'chatTimestamp',
})
export class ChatTimestampPipe implements PipeTransform {
  transform(timeStamp: number | object): string {
    if (typeof timeStamp !== 'number') return '...';

    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(timeStamp));
  }
}
