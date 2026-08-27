import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RuleListComponent } from './components/rule-list/rule-list.component';
import { RuleFormComponent } from './components/rule-form/rule-form.component';
import { NotificationHistoryComponent } from './components/notification-history/notification-history.component';
import { EventSimulatorComponent } from './components/event-simulator/event-simulator.component';
import { NotificationRule } from './models/rule.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RuleListComponent,
    RuleFormComponent,
    NotificationHistoryComponent,
    EventSimulatorComponent,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  activeTab: 'rules' | 'form' | 'history' | 'simulator' = 'rules';
  ruleToEdit: NotificationRule | null = null;

  switchTab(tab: 'rules' | 'form' | 'history' | 'simulator'): void {
    if (tab !== 'form') {
      this.ruleToEdit = null;
    }
    this.activeTab = tab;
  }

  onCreateNewRule(): void {
    this.ruleToEdit = null;
    this.activeTab = 'form';
  }

  onEditRule(rule: NotificationRule): void {
    this.ruleToEdit = rule;
    this.activeTab = 'form';
  }

  onRuleSaved(): void {
    this.ruleToEdit = null;
    this.activeTab = 'rules';
  }

  onFormCancelled(): void {
    this.ruleToEdit = null;
    this.activeTab = 'rules';
  }
}
