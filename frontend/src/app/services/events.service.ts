import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TriggerEventRequest, TriggerEventResponse } from '../models/event.model';

@Injectable({
  providedIn: 'root',
})
export class EventsService {
  private readonly apiUrl = 'http://localhost:3000/api/events';

  constructor(private readonly http: HttpClient) {}

  triggerEvent(request: TriggerEventRequest): Observable<TriggerEventResponse> {
    return this.http.post<TriggerEventResponse>(this.apiUrl, request);
  }
}
