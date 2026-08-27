import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EventsService } from '../../services/events.service';
import { TriggerEventResponse } from '../../models/event.model';

@Component({
  selector: 'app-event-simulator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './event-simulator.component.html',
  styleUrls: ['./event-simulator.component.scss'],
})
export class EventSimulatorComponent implements OnInit {
  eventType = 'order.created';
  eventId = '';
  jsonPayloadString = '';
  
  isSubmitting = false;
  errorMessage = '';
  lastResponse: TriggerEventResponse | null = null;
  lastSubmittedEventId = '';

  readonly presetTemplates = [
    {
      name: 'High-Value Order ($15,400 USD)',
      eventType: 'order.created',
      payload: {
        orderId: 'ORD-88214',
        customerName: 'Global Enterprises Inc',
        orderValue: 15400,
        currency: 'USD',
      },
    },
    {
      name: 'Standard Order ($1,500 USD)',
      eventType: 'order.created',
      payload: {
        orderId: 'ORD-10023',
        customerName: 'Jane Smith',
        orderValue: 1500,
        currency: 'USD',
      },
    },
    {
      name: 'VIP User Signup',
      eventType: 'user.signup',
      payload: {
        user: {
          name: 'Sarah Connor',
          email: 'sarah@skynet.org',
          tier: 'VIP',
          concierge: 'Agent Smith',
        },
      },
    },
    {
      name: 'Low Stock Alert (12 Units Left)',
      eventType: 'inventory.updated',
      payload: {
        sku: 'LAPTOP-PRO-15',
        stockLevel: 12,
        warehouseId: 'WH-EAST-1',
      },
    },
  ];

  constructor(private readonly eventsService: EventsService) {}

  ngOnInit(): void {
    this.generateNewEventId();
    this.applyPreset(this.presetTemplates[0]);
  }

  generateNewEventId(): void {
    this.eventId = 'evt_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
  }

  useLastSubmittedEventId(): void {
    if (this.lastSubmittedEventId) {
      this.eventId = this.lastSubmittedEventId;
    }
  }

  applyPreset(preset: any): void {
    this.eventType = preset.eventType;
    this.jsonPayloadString = JSON.stringify(preset.payload, null, 2);
  }

  triggerEvent(): void {
    this.errorMessage = '';
    this.lastResponse = null;

    if (!this.eventType.trim()) {
      this.errorMessage = 'Trigger Event type is required.';
      return;
    }

    if (!this.eventId.trim()) {
      this.errorMessage = 'Event ID (Idempotency Key) is required.';
      return;
    }

    let parsedPayload: Record<string, any>;
    try {
      parsedPayload = JSON.parse(this.jsonPayloadString);
    } catch (e: any) {
      this.errorMessage = `Invalid JSON Payload syntax: ${e.message}`;
      return;
    }

    this.isSubmitting = true;
    const request = {
      eventType: this.eventType.trim(),
      eventId: this.eventId.trim(),
      payload: parsedPayload,
    };

    this.eventsService.triggerEvent(request).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.lastResponse = response;
        this.lastSubmittedEventId = this.eventId;
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = err.error?.message || 'Failed to dispatch event to backend pipeline.';
      },
    });
  }
}
