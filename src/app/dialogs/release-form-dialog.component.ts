import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

export interface ReleaseFormData {
  version: string | null;
  date: string | null;
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
  ],
  template: `
    <h2 mat-dialog-title>{{ data?.version != null ? 'Edit release' : 'Add release' }}</h2>
    <mat-dialog-content>
      <p class="hint">Leave both empty for "Next release". Set version and date when you publish.</p>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Version</mat-label>
        <input matInput [(ngModel)]="version" placeholder="e.g. 1.5.0" name="version" />
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Date</mat-label>
        <input matInput [(ngModel)]="date" placeholder="YYYY-MM-DD" name="date" />
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" (click)="submit()">Save</button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .hint { margin: 0 0 16px; font-size: 0.9rem; color: rgba(0,0,0,0.6); }
      .full-width { width: 100%; display: block; }
    `,
  ],
})
export class ReleaseFormDialogComponent {
  readonly data = inject<ReleaseFormData | null>(MAT_DIALOG_DATA);
  private readonly ref = inject(MatDialogRef<ReleaseFormDialogComponent>);

  version: string = this.data?.version ?? '';
  date: string = this.data?.date ?? '';

  submit(): void {
    this.ref.close({
      version: this.version.trim() || null,
      date: this.date.trim() || null,
    });
  }
}
