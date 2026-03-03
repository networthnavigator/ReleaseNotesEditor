import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { parseYyyyMmDd, toYyyyMmDd } from '../utils/date.utils';

const DD_MM_YYYY_FORMATS = {
  parse: { dateInput: null as any, timeInput: null as any },
  display: {
    dateInput: { day: '2-digit', month: '2-digit', year: 'numeric' } as Intl.DateTimeFormatOptions,
    monthYearLabel: { year: 'numeric', month: 'short' } as Intl.DateTimeFormatOptions,
    dateA11yLabel: { year: 'numeric', month: 'long', day: 'numeric' } as Intl.DateTimeFormatOptions,
    monthYearA11yLabel: { year: 'numeric', month: 'long' } as Intl.DateTimeFormatOptions,
    timeInput: { hour: 'numeric', minute: 'numeric' } as Intl.DateTimeFormatOptions,
    timeOptionLabel: { hour: 'numeric', minute: 'numeric' } as Intl.DateTimeFormatOptions,
  },
};

export interface ReleaseFormData {
  version: string | null;
  date: string | null;
  description?: string | null;
}

@Component({
  selector: 'app-release-form-dialog',
  standalone: true,
  imports: [
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
  ],
  providers: [
    provideNativeDateAdapter(DD_MM_YYYY_FORMATS),
    { provide: MAT_DATE_LOCALE, useValue: 'nl-NL' },
  ],
  template: `
    <h2 mat-dialog-title>Edit release</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Version</mat-label>
        <input matInput [(ngModel)]="version" placeholder="e.g. 1.5.0" name="version" />
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Date</mat-label>
        <input matInput [matDatepicker]="picker" [(ngModel)]="dateValue" name="date" />
        <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
        <mat-datepicker #picker></mat-datepicker>
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Description</mat-label>
        <textarea matInput [(ngModel)]="description" placeholder="e.g. This release focused on..." name="description" rows="3"></textarea>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" (click)="submit()">Save</button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .full-width { width: 100%; display: block; }
    `,
  ],
})
export class ReleaseFormDialogComponent {
  readonly data = inject<ReleaseFormData | null>(MAT_DIALOG_DATA);
  private readonly ref = inject(MatDialogRef<ReleaseFormDialogComponent>);

  version: string = this.data?.version ?? '';
  dateValue: Date | null = parseYyyyMmDd(this.data?.date ?? '') ?? null;
  description: string = this.data?.description ?? '';

  submit(): void {
    this.ref.close({
      version: this.version.trim() || null,
      date: this.dateValue ? toYyyyMmDd(this.dateValue) : null,
      description: this.description.trim() || null,
    });
  }
}
