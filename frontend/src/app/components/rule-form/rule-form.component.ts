import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormGroup,
  FormArray,
  FormControl,
  Validators,
  FormBuilder,
} from '@angular/forms';
import { RulesService } from '../../services/rules.service';
import { NotificationRule, Operator } from '../../models/rule.model';

import { GlassSelectComponent, SelectOption } from '../glass-select/glass-select.component';

@Component({
  selector: 'app-rule-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, GlassSelectComponent],
  templateUrl: './rule-form.component.html',
  styleUrls: ['./rule-form.component.scss'],
})
export class RuleFormComponent implements OnInit {
  @Input() ruleToEdit: NotificationRule | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  ruleForm!: FormGroup;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';

  readonly operatorOptions: SelectOption[] = [
    { label: 'Greater Than (gt)', value: 'gt' },
    { label: 'Greater or Equal (gte)', value: 'gte' },
    { label: 'Less Than (lt)', value: 'lt' },
    { label: 'Less or Equal (lte)', value: 'lte' },
    { label: 'Equals (eq)', value: 'eq' },
    { label: 'Not Equals (neq)', value: 'neq' },
    { label: 'Contains (contains)', value: 'contains' },
  ];

  constructor(
    private readonly fb: FormBuilder,
    private readonly rulesService: RulesService
  ) {}

  ngOnInit(): void {
    this.initForm();
    if (this.ruleToEdit) {
      this.populateForm(this.ruleToEdit);
    } else {
      // Add one empty condition row by default
      this.addConditionRow();
    }
  }

  get conditionsFormArray(): FormArray {
    return this.ruleForm.get('conditions') as FormArray;
  }

  get isEditMode(): boolean {
    return !!this.ruleToEdit;
  }

  private initForm(): void {
    this.ruleForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      triggerEvent: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9_.-]+$/)]],
      conditions: this.fb.array([]),
      recipientsInput: ['', [Validators.required]],
      channels: this.fb.group({
        email: [true],
        in_app: [true],
      }),
      messageTemplate: ['', [Validators.required]],
      isEnabled: [true],
    });
  }

  private populateForm(rule: NotificationRule): void {
    this.ruleForm.patchValue({
      name: rule.name,
      triggerEvent: rule.triggerEvent,
      recipientsInput: rule.recipients.join(', '),
      channels: {
        email: rule.channels.includes('email'),
        in_app: rule.channels.includes('in_app'),
      },
      messageTemplate: rule.messageTemplate,
      isEnabled: rule.isEnabled,
    });

    // Populate conditions FormArray
    this.conditionsFormArray.clear();
    if (rule.conditions && rule.conditions.length > 0) {
      rule.conditions.forEach((c) => {
        this.addConditionRow(c.field, c.operator, c.value);
      });
    } else {
      this.addConditionRow();
    }
  }

  addConditionRow(field = '', operator: Operator = 'gt', value: any = ''): void {
    const conditionGroup = this.fb.group({
      field: [field, [Validators.required]],
      operator: [operator, [Validators.required]],
      value: [value, [Validators.required]],
    });
    this.conditionsFormArray.push(conditionGroup);
  }

  removeConditionRow(index: number): void {
    this.conditionsFormArray.removeAt(index);
  }

  getDetectedPlaceholders(): string[] {
    const template = this.ruleForm.get('messageTemplate')?.value || '';
    const matches = template.match(/\{\{\s*([\w.]+)\s*\}\}/g);
    if (!matches) return [];
    return Array.from(new Set(matches.map((m: string) => m.replace(/[\{\}\s]/g, ''))));
  }

  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.ruleForm.invalid) {
      this.ruleForm.markAllAsTouched();
      this.errorMessage = 'Please complete all required fields correctly before saving.';
      return;
    }

    // Extract selected channels
    const channelValues = this.ruleForm.get('channels')?.value || {};
    const selectedChannels: string[] = [];
    if (channelValues.email) selectedChannels.push('email');
    if (channelValues.in_app) selectedChannels.push('in_app');

    if (selectedChannels.length === 0) {
      this.errorMessage = 'At least one notification channel must be selected.';
      return;
    }

    // Parse recipients
    const recipientsRaw: string = this.ruleForm.get('recipientsInput')?.value || '';
    const recipients = recipientsRaw
      .split(',')
      .map((r) => r.trim())
      .filter((r) => r.length > 0);

    if (recipients.length === 0) {
      this.errorMessage = 'At least one recipient must be provided.';
      return;
    }

    // Clean conditions
    const rawConditions = this.conditionsFormArray.value;
    const conditions = rawConditions.map((c: any) => {
      let val = c.value;
      // Convert numeric string to number if appropriate
      if (typeof val === 'string' && !isNaN(Number(val)) && val.trim() !== '') {
        val = Number(val);
      }
      return {
        field: c.field.trim(),
        operator: c.operator,
        value: val,
      };
    });

    const payload = {
      name: this.ruleForm.get('name')?.value.trim(),
      triggerEvent: this.ruleForm.get('triggerEvent')?.value.trim(),
      conditions,
      recipients,
      channels: selectedChannels,
      messageTemplate: this.ruleForm.get('messageTemplate')?.value.trim(),
      isEnabled: this.ruleForm.get('isEnabled')?.value,
    };

    this.isSubmitting = true;

    if (this.isEditMode && this.ruleToEdit) {
      this.rulesService.updateRule(this.ruleToEdit.id, payload).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.saved.emit();
        },
        error: (err) => {
          this.isSubmitting = false;
          this.errorMessage = err.error?.message || 'Failed to update notification rule.';
        },
      });
    } else {
      this.rulesService.createRule(payload).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.saved.emit();
        },
        error: (err) => {
          this.isSubmitting = false;
          this.errorMessage = err.error?.message || 'Failed to create notification rule.';
        },
      });
    }
  }
}
