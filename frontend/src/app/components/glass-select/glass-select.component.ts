import { Component, ElementRef, EventEmitter, HostListener, Input, Output, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface SelectOption {
  label: string;
  value: any;
}

@Component({
  selector: 'app-glass-select',
  standalone: true,
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => GlassSelectComponent),
      multi: true,
    },
  ],
  templateUrl: './glass-select.component.html',
  styleUrls: ['./glass-select.component.scss'],
})
export class GlassSelectComponent implements ControlValueAccessor {
  @Input() options: SelectOption[] = [];
  @Input() placeholder: string = 'Select option...';
  @Input() disabled: boolean = false;
  @Input() customClass: string = '';

  @Output() valueChange = new EventEmitter<any>();
  @Output() change = new EventEmitter<any>();

  isOpen = false;
  value: any = '';

  private onChange: (val: any) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private elementRef: ElementRef) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }

  get selectedLabel(): string {
    const found = this.options.find((opt) => opt.value === this.value);
    return found ? found.label : this.placeholder;
  }

  toggleDropdown() {
    if (this.disabled) return;
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.onTouched();
    }
  }

  selectOption(opt: SelectOption, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.value = opt.value;
    this.onChange(this.value);
    this.valueChange.emit(this.value);
    this.change.emit(this.value);
    this.isOpen = false;
  }

  // ControlValueAccessor methods
  writeValue(val: any): void {
    this.value = val;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
