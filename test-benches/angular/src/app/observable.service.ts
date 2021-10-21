import { Injectable } from '@angular/core';
import { interval, Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class ObservableService {
  public getObservable(): Observable<number> {
    return interval(1000).pipe(
      map((i) => i * 2),
      map((i) => i - 1),
      take(10)
    );
  }
}
