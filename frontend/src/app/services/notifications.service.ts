import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  NotificationLog,
  NotificationQueryFilter,
  PaginatedResponse,
} from '../models/notification.model';

@Injectable({
  providedIn: 'root',
})
export class NotificationsService {
  private readonly apiUrl = 'http://localhost:3000/api/notifications';

  constructor(private readonly http: HttpClient) {}

  getNotifications(
    filter: NotificationQueryFilter,
  ): Observable<PaginatedResponse<NotificationLog>> {
    let params = new HttpParams();

    if (filter.page !== undefined) params = params.set('page', String(filter.page));
    if (filter.limit !== undefined) params = params.set('limit', String(filter.limit));
    if (filter.status) params = params.set('status', filter.status);
    if (filter.channel) params = params.set('channel', filter.channel);
    if (filter.recipient) params = params.set('recipient', filter.recipient);
    if (filter.dateFrom) params = params.set('dateFrom', filter.dateFrom);
    if (filter.dateTo) params = params.set('dateTo', filter.dateTo);

    return this.http.get<PaginatedResponse<NotificationLog>>(this.apiUrl, {
      params,
    });
  }
}
