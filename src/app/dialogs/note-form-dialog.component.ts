import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import type { NoteType } from '../domain/value-objects/note-type.vo';
import { MarkdownEditorComponent } from '../components/markdown-editor/markdown-editor.component';

export interface NoteFormData {
  type: NoteType;
  title: string;
  note_md: string;
}

@Component({
  selector: 'app-note-form-dialog',
  standalone: true,
  imports: [
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MarkdownEditorComponent,
  ],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Edit note' : 'Add note' }}</h2>
    <mat-dialog-content>
      <div class="form-row">
        <mat-form-field appearance="outline" class="field-type">
          <mat-label>Type</mat-label>
          <mat-select [(ngModel)]="type" name="type">
            <mat-option value="NEW">NEW</mat-option>
            <mat-option value="UPDATE">UPDATE</mat-option>
            <mat-option value="BUG">BUG</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" class="field-title">
          <mat-label>Title</mat-label>
          <input matInput [(ngModel)]="title" name="title" required />
        </mat-form-field>
      </div>
      <p class="md-label">Content (Markdown)</p>
      <div class="md-editor-wrap">
        <app-markdown-editor [(noteMd)]="noteMd" />
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" (click)="submit()" [disabled]="!title.trim()">Save</button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      :host { display: flex; flex-direction: column; min-height: 0; }
      mat-dialog-content {
        flex: 1;
        min-height: 0;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        padding-top: 20px;
      }
      .form-row { display: flex; gap: 16px; flex-shrink: 0; margin-bottom: 8px; }
      .form-row mat-form-field { padding-top: 0; }
      .field-type { width: 140px; }
      .field-title { flex: 1; min-width: 0; }
      .md-label { margin: 12px 0 6px; font-size: 0.875rem; color: rgba(0,0,0,0.6); flex-shrink: 0; }
      .md-editor-wrap { flex: 1; min-height: 320px; display: flex; flex-direction: column; min-width: 0; overflow: hidden; }
      .md-editor-wrap app-markdown-editor { flex: 1; min-height: 0; display: flex; flex-direction: column; }
      .md-editor-wrap app-markdown-editor ::ng-deep .md-editor { flex: 1; min-height: 0; display: flex; flex-direction: column; }
      .md-editor-wrap app-markdown-editor ::ng-deep .md-panels { flex: 1; min-height: 0; }
      .md-editor-wrap app-markdown-editor ::ng-deep .md-textarea { min-height: 300px; }
      mat-dialog-actions { flex-shrink: 0; margin-bottom: 0; padding-bottom: 16px; }
    `,
  ],
})
export class NoteFormDialogComponent {
  readonly data = inject<NoteFormData | null>(MAT_DIALOG_DATA);
  private readonly ref = inject(MatDialogRef<NoteFormDialogComponent>);

  type: NoteType = this.data?.type ?? 'NEW';
  title = this.data?.title ?? '';
  noteMd = this.data?.note_md ?? '';

  submit(): void {
    if (!this.title.trim()) return;
    this.ref.close({
      type: this.type,
      title: this.title.trim(),
      note_md: this.noteMd.trim(),
    });
  }
}
