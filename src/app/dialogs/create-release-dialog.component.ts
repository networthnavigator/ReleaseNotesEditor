import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import type { ReleaseNoteEntity } from '../domain/entities/release-note.entity';
import { toYyyyMmDd } from '../utils/date.utils';

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

export interface CreateReleaseDialogData {
  draftNotes: ReleaseNoteEntity[];
}

export interface CreateReleaseDialogResult {
  version: string;
  date: string;
  description: string | null;
  noteIds: string[];
}

@Component({
  selector: 'app-create-release-dialog',
  standalone: true,
  imports: [
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatStepperModule,
    MatTooltipModule,
    MatDatepickerModule,
    DragDropModule,
  ],
  providers: [
    provideNativeDateAdapter(DD_MM_YYYY_FORMATS),
    { provide: MAT_DATE_LOCALE, useValue: 'nl-NL' },
  ],
  template: `
    <h2 mat-dialog-title>Create release</h2>
    <mat-dialog-content>
      <mat-stepper linear>
        <mat-step>
          <ng-template matStepLabel>Release details</ng-template>
          <div class="step-fields">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Version</mat-label>
              <input matInput [(ngModel)]="version" placeholder="e.g. 1.5.0" name="version" required />
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Date</mat-label>
              <input matInput [matDatepicker]="picker" [(ngModel)]="dateValue" name="date" required />
              <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
              <mat-datepicker #picker></mat-datepicker>
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Description</mat-label>
              <textarea matInput [(ngModel)]="description" placeholder="e.g. This release focused on addressing feedback from the August 2025 demo." name="description" rows="3"></textarea>
            </mat-form-field>
          </div>
          <div class="step-actions">
            <button mat-raised-button color="primary" matStepperNext [disabled]="!canProceedStep1()">
              Next: Select notes
            </button>
          </div>
        </mat-step>
        <mat-step>
          <ng-template matStepLabel>Select notes</ng-template>
          <p class="step-hint">Choose which draft notes to include in this release. Unselected notes stay in Draft release.</p>
          <div class="two-panels">
            <div class="panel">
              <h3 class="panel-title">Draft release</h3>
              <div class="panel-list" id="draft-list" cdkDropList [cdkDropListData]="draftList()" (cdkDropListDropped)="dropDraft($event)" [cdkDropListConnectedTo]="[selectedListId]">
                @for (note of draftList(); track note.id) {
                  <div class="panel-item" cdkDrag>
                    <span class="drag-handle" cdkDragHandle>⋮⋮</span>
                    <span class="note-chip" [attr.data-type]="note.type">{{ note.type }}</span>
                    <span class="note-title">{{ note.title }}</span>
                    <button mat-icon-button type="button" (click)="addToSelected(note)" matTooltip="Add to release">
                      <span class="material-symbols-outlined">add_circle</span>
                    </button>
                  </div>
                }
                @empty {
                  <p class="panel-empty">No notes left in draft.</p>
                }
              </div>
              <button mat-stroked-button type="button" class="select-all-btn" (click)="selectAll()" [disabled]="draftList().length === 0">
                Select all
              </button>
            </div>
            <div class="panel" [id]="selectedListId">
              <h3 class="panel-title">Notes in this release</h3>
              <div class="panel-list" cdkDropList [id]="selectedListId" [cdkDropListData]="selectedList()" (cdkDropListDropped)="dropSelected($event)" [cdkDropListConnectedTo]="['draft-list']">
                @for (note of selectedList(); track note.id) {
                  <div class="panel-item" cdkDrag>
                    <span class="drag-handle" cdkDragHandle>⋮⋮</span>
                    <span class="note-chip" [attr.data-type]="note.type">{{ note.type }}</span>
                    <span class="note-title">{{ note.title }}</span>
                    <button mat-icon-button type="button" (click)="removeFromSelected(note)" matTooltip="Remove from release">
                      <span class="material-symbols-outlined">remove_circle</span>
                    </button>
                  </div>
                }
                @empty {
                  <p class="panel-empty">No notes selected.</p>
                }
              </div>
            </div>
          </div>
          <div class="step-actions">
            <button mat-button matStepperPrevious>Back</button>
            <button mat-raised-button color="primary" (click)="submit()" [disabled]="selectedList().length === 0">
              Create release
            </button>
          </div>
        </mat-step>
      </mat-stepper>
    </mat-dialog-content>
  `,
  styles: [
    `
      .step-fields { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
      .full-width { width: 100%; }
      .step-hint { margin: 0 0 16px; color: rgba(0,0,0,0.6); font-size: 0.9rem; }
      .step-actions { margin-top: 16px; display: flex; gap: 8px; }
      .two-panels { display: flex; gap: 16px; min-height: 280px; }
      .panel { flex: 1; border: 1px solid rgba(0,0,0,0.12); border-radius: 8px; padding: 12px; display: flex; flex-direction: column; }
      .panel-title { margin: 0 0 8px; font-size: 0.95rem; font-weight: 600; }
      .panel-list { flex: 1; min-height: 180px; border: 1px dashed rgba(0,0,0,0.2); border-radius: 6px; padding: 8px; }
      .panel-list.cdk-drop-list-dragging .panel-item { opacity: 0.8; }
      .panel-item { display: flex; align-items: center; gap: 8px; padding: 8px; margin-bottom: 4px; background: #f5f5f5; border-radius: 6px; cursor: move; }
      .panel-item:last-child { margin-bottom: 0; }
      .drag-handle { cursor: grab; color: #999; font-size: 14px; }
      .note-chip { font-size: 0.7rem; font-weight: 600; padding: 2px 6px; border-radius: 4px; }
      .note-chip[data-type='NEW'] { background: rgba(25,118,210,0.2); color: #1565c0; }
      .note-chip[data-type='UPDATE'] { background: rgba(255,152,0,0.2); color: #e65100; }
      .note-chip[data-type='BUG'] { background: rgba(211,47,47,0.2); color: #c62828; }
      .note-title { flex: 1; font-size: 0.9rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .panel-empty { margin: 0; padding: 16px; color: rgba(0,0,0,0.5); font-size: 0.9rem; text-align: center; }
      .select-all-btn { margin-top: 8px; }
    `,
  ],
})
export class CreateReleaseDialogComponent {
  readonly data = inject<CreateReleaseDialogData>(MAT_DIALOG_DATA);
  private readonly ref = inject(MatDialogRef<CreateReleaseDialogComponent>);

  readonly selectedListId = 'selected-list';

  version = '';
  dateValue: Date | null = null;
  description = '';

  /** Notes still in draft (left panel). */
  draftList = signal<ReleaseNoteEntity[]>([]);
  /** Notes selected for the new release (right panel). */
  selectedList = signal<ReleaseNoteEntity[]>([]);

  constructor() {
    this.draftList.set([...this.data.draftNotes]);
    this.selectedList.set([]);
  }

  canProceedStep1(): boolean {
    return this.version.trim().length > 0 && this.dateValue != null;
  }

  addToSelected(note: ReleaseNoteEntity): void {
    this.draftList.update((list) => list.filter((n) => n.id !== note.id));
    this.selectedList.update((list) => [...list, note]);
  }

  removeFromSelected(note: ReleaseNoteEntity): void {
    this.selectedList.update((list) => list.filter((n) => n.id !== note.id));
    this.draftList.update((list) => [...list, note]);
  }

  selectAll(): void {
    const draft = this.draftList();
    this.draftList.set([]);
    this.selectedList.update((list) => [...list, ...draft]);
  }

  dropDraft(event: CdkDragDrop<ReleaseNoteEntity[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      this.draftList.set([...event.container.data]);
    } else {
      transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
      this.draftList.set([...event.container.data]);
      this.selectedList.set([...event.previousContainer.data]);
    }
  }

  dropSelected(event: CdkDragDrop<ReleaseNoteEntity[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      this.selectedList.set([...event.container.data]);
    } else {
      transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
      this.draftList.set([...event.previousContainer.data]);
      this.selectedList.set([...event.container.data]);
    }
  }

  submit(): void {
    const noteIds = this.selectedList().map((n) => n.id);
    this.ref.close({
      version: this.version.trim(),
      date: this.dateValue ? toYyyyMmDd(this.dateValue) : '',
      description: this.description.trim() || null,
      noteIds,
    } as CreateReleaseDialogResult);
  }
}
