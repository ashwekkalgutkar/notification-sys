import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { RuleFormComponent } from './rule-form.component';
import { RulesService } from '../../services/rules.service';

describe('RuleFormComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RuleFormComponent, ReactiveFormsModule],
      providers: [
        RulesService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(RuleFormComponent);
    const comp = fixture.componentInstance;
    fixture.detectChanges();
    expect(comp).toBeTruthy();
  });

  it('should initialize with an invalid form (empty required fields)', () => {
    const fixture = TestBed.createComponent(RuleFormComponent);
    const comp = fixture.componentInstance;
    fixture.detectChanges();
    expect(comp.ruleForm.invalid).toBe(true);
  });

  it('should add one empty condition row on init (no ruleToEdit)', () => {
    const fixture = TestBed.createComponent(RuleFormComponent);
    const comp = fixture.componentInstance;
    fixture.detectChanges();
    expect(comp.conditionsFormArray.length).toBe(1);
  });

  it('should add a condition row when addConditionRow() is called', () => {
    const fixture = TestBed.createComponent(RuleFormComponent);
    const comp = fixture.componentInstance;
    fixture.detectChanges();
    const before = comp.conditionsFormArray.length;
    comp.addConditionRow('orderValue', 'gte', 100);
    expect(comp.conditionsFormArray.length).toBe(before + 1);
  });

  it('should remove a condition row when removeConditionRow() is called', () => {
    const fixture = TestBed.createComponent(RuleFormComponent);
    const comp = fixture.componentInstance;
    fixture.detectChanges();
    comp.addConditionRow('amount', 'gt', 50);
    const before = comp.conditionsFormArray.length;
    comp.removeConditionRow(0);
    expect(comp.conditionsFormArray.length).toBe(before - 1);
  });

  it('should detect placeholders from the messageTemplate field', () => {
    const fixture = TestBed.createComponent(RuleFormComponent);
    const comp = fixture.componentInstance;
    fixture.detectChanges();
    comp.ruleForm.get('messageTemplate')!.setValue('Order {{orderId}} for {{customerName}}');
    const placeholders = comp.getDetectedPlaceholders();
    expect(placeholders).toContain('orderId');
    expect(placeholders).toContain('customerName');
  });

  it('should return no placeholders for a template with no {{...}} tokens', () => {
    const fixture = TestBed.createComponent(RuleFormComponent);
    const comp = fixture.componentInstance;
    fixture.detectChanges();
    comp.ruleForm.get('messageTemplate')!.setValue('Plain notification message.');
    expect(comp.getDetectedPlaceholders()).toEqual([]);
  });

  it('isEditMode should be false when no ruleToEdit is provided', () => {
    const fixture = TestBed.createComponent(RuleFormComponent);
    const comp = fixture.componentInstance;
    fixture.detectChanges();
    expect(comp.isEditMode).toBe(false);
  });

  it('should expose 7 operator options', () => {
    const fixture = TestBed.createComponent(RuleFormComponent);
    const comp = fixture.componentInstance;
    fixture.detectChanges();
    expect(comp.operatorOptions.length).toBe(7);
  });
});
