import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificationsService } from '../../services/notifications.service';
import {
  NotificationLog,
  NotificationQueryFilter,
  PaginatedResponse,
} from '../../models/notification.model';

import { GlassSelectComponent, SelectOption } from '../glass-select/glass-select.component';

@Component({
  selector: 'app-notification-history',
  standalone: true,
  imports: [CommonModule, FormsModule, GlassSelectComponent],
  templateUrl: './notification-history.component.html',
  styleUrls: ['./notification-history.component.scss'],
})
export class NotificationHistoryComponent implements OnInit {
  Math = Math;
  logs: NotificationLog[] = [];
  meta = {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  };

  isLoading = false;
  errorMessage = '';

  // Filter state
  statusFilter = '';
  channelFilter = '';
  recipientFilter = '';
  dateFromFilter = '';
  dateToFilter = '';

  statusOptions: SelectOption[] = [
    { label: 'All Statuses', value: '' },
    { label: 'SENT', value: 'sent' },
    { label: 'FAILED', value: 'failed' },
    { label: 'SKIPPED', value: 'skipped' },
  ];

  channelOptions: SelectOption[] = [
    { label: 'All Channels', value: '' },
    { label: 'Email', value: 'email' },
    { label: 'In-App', value: 'in_app' },
  ];

  selectedPayloadForModal: any | null = null;
  selectedLogDetails: NotificationLog | null = null;

  constructor(private readonly notificationsService: NotificationsService) {}

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(page = 1): void {
    this.isLoading = true;
    this.errorMessage = '';

    const filter: NotificationQueryFilter = {
      page,
      limit: this.meta.limit,
      status: this.statusFilter || undefined,
      channel: this.channelFilter || undefined,
      recipient: this.recipientFilter.trim() || undefined,
      dateFrom: this.dateFromFilter || undefined,
      dateTo: this.dateToFilter || undefined,
    };

    this.notificationsService.getNotifications(filter).subscribe({
      next: (response: PaginatedResponse<NotificationLog>) => {
        this.logs = response.data;
        this.meta = response.meta;
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to fetch notification history.';
        this.isLoading = false;
      },
    });
  }

  applyFilters(): void {
    this.loadLogs(1);
  }

  clearFilters(): void {
    this.statusFilter = '';
    this.channelFilter = '';
    this.recipientFilter = '';
    this.dateFromFilter = '';
    this.dateToFilter = '';
    this.loadLogs(1);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.meta.totalPages) {
      this.loadLogs(page);
    }
  }

  inspectPayload(log: NotificationLog): void {
    this.selectedLogDetails = log;
    this.selectedPayloadForModal = log.payload;
  }

  closePayloadModal(): void {
    this.selectedPayloadForModal = null;
    this.selectedLogDetails = null;
  }
}
