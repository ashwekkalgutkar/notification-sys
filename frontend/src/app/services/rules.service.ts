import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  NotificationRule,
  CreateRuleRequest,
  UpdateRuleRequest,
} from '../models/rule.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class RulesService {
  private readonly apiUrl = `${environment.apiUrl}/api/rules`;

  constructor(private readonly http: HttpClient) {}

  getRules(isEnabled?: boolean): Observable<NotificationRule[]> {
    let params = new HttpParams();
    if (isEnabled !== undefined) {
      params = params.set('isEnabled', String(isEnabled));
    }
    return this.http.get<NotificationRule[]>(this.apiUrl, { params });
  }

  getRule(id: string): Observable<NotificationRule> {
    return this.http.get<NotificationRule>(`${this.apiUrl}/${id}`);
  }

  createRule(rule: CreateRuleRequest): Observable<NotificationRule> {
    return this.http.post<NotificationRule>(this.apiUrl, rule);
  }

  updateRule(id: string, rule: UpdateRuleRequest): Observable<NotificationRule> {
    return this.http.patch<NotificationRule>(`${this.apiUrl}/${id}`, rule);
  }

  deleteRule(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }
}
