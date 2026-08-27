import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RulesService } from '../../services/rules.service';
import { NotificationRule } from '../../models/rule.model';

@Component({
  selector: 'app-rule-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rule-list.component.html',
  styleUrls: ['./rule-list.component.scss'],
})
export class RuleListComponent implements OnInit {
  @Output() editRule = new EventEmitter<NotificationRule>();
  @Output() createNew = new EventEmitter<void>();

  rules: NotificationRule[] = [];
  filteredRules: NotificationRule[] = [];
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  filterStatus: 'all' | 'enabled' | 'disabled' = 'all';
  searchQuery = '';

  selectedRuleForView: NotificationRule | null = null;

  constructor(private readonly rulesService: RulesService) {}

  ngOnInit(): void {
    this.loadRules();
  }

  loadRules(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    let isEnabledParam: boolean | undefined = undefined;
    if (this.filterStatus === 'enabled') isEnabledParam = true;
    if (this.filterStatus === 'disabled') isEnabledParam = false;

    this.rulesService.getRules(isEnabledParam).subscribe({
      next: (data) => {
        this.rules = data;
        this.applySearchFilter();
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to fetch notification rules.';
        this.isLoading = false;
      },
    });
  }

  applySearchFilter(): void {
    if (!this.searchQuery.trim()) {
      this.filteredRules = [...this.rules];
      return;
    }

    const q = this.searchQuery.toLowerCase();
    this.filteredRules = this.rules.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.triggerEvent.toLowerCase().includes(q) ||
        r.messageTemplate.toLowerCase().includes(q)
    );
  }

  onFilterStatusChange(status: 'all' | 'enabled' | 'disabled'): void {
    this.filterStatus = status;
    this.loadRules();
  }

  toggleEnable(rule: NotificationRule): void {
    const updatedStatus = !rule.isEnabled;
    this.rulesService.updateRule(rule.id, { isEnabled: updatedStatus }).subscribe({
      next: (updated) => {
        rule.isEnabled = updated.isEnabled;
        this.showTemporarySuccess(
          `Rule '${rule.name}' is now ${updated.isEnabled ? 'Enabled' : 'Disabled'}.`
        );
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to toggle rule state.';
      },
    });
  }

  onEdit(rule: NotificationRule): void {
    this.editRule.emit(rule);
  }

  onDelete(rule: NotificationRule): void {
    if (!confirm(`Are you sure you want to delete rule '${rule.name}'?`)) {
      return;
    }

    this.rulesService.deleteRule(rule.id).subscribe({
      next: () => {
        this.rules = this.rules.filter((r) => r.id !== rule.id);
        this.applySearchFilter();
        this.showTemporarySuccess(`Rule '${rule.name}' deleted successfully.`);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to delete rule.';
      },
    });
  }

  viewDetails(rule: NotificationRule): void {
    this.selectedRuleForView = rule;
  }

  closeDetails(): void {
    this.selectedRuleForView = null;
  }

  formatConditions(rule: NotificationRule): string {
    if (!rule.conditions || rule.conditions.length === 0) {
      return 'Always Match (No Conditions)';
    }
    return rule.conditions
      .map((c) => `${c.field} ${c.operator} ${JSON.stringify(c.value)}`)
      .join(' AND ');
  }

  private showTemporarySuccess(msg: string): void {
    this.successMessage = msg;
    setTimeout(() => {
      this.successMessage = '';
    }, 4000);
  }
}
